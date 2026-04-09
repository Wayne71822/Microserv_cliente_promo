"""
RestoHub - Loyalty & Promos Service
Microservicio de Promos y Fidelización
Tecnologías: FastAPI + Strawberry GraphQL + PostgreSQL + Redis (caché de puntos)
"""

from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from strawberry.federation import Schema
import strawberry
from typing import Optional, List
import databases
import sqlalchemy
from datetime import datetime, timedelta
import aio_pika
import json
import redis.asyncio as aioredis
import os
from enum import Enum

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@loyalty-db:5432/loyalty_db")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# ─── BASE DE DATOS ─────────────────────────────────────────────────────────────
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

loyalty_accounts_table = sqlalchemy.Table(
    "loyalty_accounts", metadata,
    sqlalchemy.Column("customer_id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("total_points", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime),
)

point_transactions_table = sqlalchemy.Table(
    "point_transactions", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer,
                      primary_key=True, autoincrement=True),
    sqlalchemy.Column("customer_id", sqlalchemy.String),
    sqlalchemy.Column("order_id", sqlalchemy.String, nullable=True),
    # positivo=ganó, negativo=canjeó
    sqlalchemy.Column("points_delta", sqlalchemy.Integer),
    sqlalchemy.Column("description", sqlalchemy.String),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime,
                      default=datetime.utcnow),
)

promotions_table = sqlalchemy.Table(
    "promotions", metadata,
    sqlalchemy.Column("id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("name", sqlalchemy.String),
    sqlalchemy.Column("description", sqlalchemy.String),
    sqlalchemy.Column("scope", sqlalchemy.String),  # global / brand / local
    sqlalchemy.Column("scope_id", sqlalchemy.String,
                      nullable=True),  # brand_id o restaurant_id
    sqlalchemy.Column("discount_pct", sqlalchemy.Float,
                      nullable=True),  # ej. 15.0 = 15%
    sqlalchemy.Column("discount_fixed", sqlalchemy.Float, nullable=True),
    # por_stock / por_tiempo
    sqlalchemy.Column("promo_type", sqlalchemy.String),
    sqlalchemy.Column("stock_limit", sqlalchemy.Integer, nullable=True),
    sqlalchemy.Column("stock_used", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("valid_from", sqlalchemy.DateTime),
    sqlalchemy.Column("valid_until", sqlalchemy.DateTime, nullable=True),
    sqlalchemy.Column("is_active", sqlalchemy.Boolean, default=True),
    # lista de platos que aplica
    sqlalchemy.Column("dish_ids", sqlalchemy.JSON, nullable=True),
)

redemptions_table = sqlalchemy.Table(
    "redemptions", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer,
                      primary_key=True, autoincrement=True),
    sqlalchemy.Column("customer_id", sqlalchemy.String),
    sqlalchemy.Column("promotion_id", sqlalchemy.String),
    sqlalchemy.Column("order_id", sqlalchemy.String),
    sqlalchemy.Column("discount_applied", sqlalchemy.Float),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime,
                      default=datetime.utcnow),
)

# ─── REDIS ─────────────────────────────────────────────────────────────────────
redis_client: aioredis.Redis = None


async def get_points_cached(customer_id: str) -> Optional[int]:
    """Intenta obtener puntos del caché Redis antes de ir a PostgreSQL."""
    cached = await redis_client.get(f"points:{customer_id}")
    if cached:
        return int(cached)
    row = await database.fetch_one(
        loyalty_accounts_table.select()
        .where(loyalty_accounts_table.c.customer_id == customer_id)
    )
    if row:
        points = row["total_points"]
        # TTL 5 min
        await redis_client.setex(f"points:{customer_id}", 300, points)
        return points
    return 0


async def invalidate_points_cache(customer_id: str):
    await redis_client.delete(f"points:{customer_id}")

# ─── TIPOS GRAPHQL ─────────────────────────────────────────────────────────────


@strawberry.enum
class PromoScope(Enum):
    GLOBAL = "global"
    BRAND = "brand"
    LOCAL = "local"


@strawberry.enum
class PromoType(Enum):
    POR_STOCK = "por_stock"
    POR_TIEMPO = "por_tiempo"


@strawberry.type
class LoyaltyAccount:
    customer_id: str
    total_points: int


@strawberry.type
class PointTransaction:
    id: int
    points_delta: int
    description: str
    created_at: str


@strawberry.type
class Promotion:
    id: str
    name: str
    description: str
    scope: str
    discount_pct: Optional[float]
    discount_fixed: Optional[float]
    promo_type: str
    stock_limit: Optional[int]
    stock_used: int
    valid_from: str
    valid_until: Optional[str]
    is_active: bool

    @strawberry.field
    def is_available(self) -> bool:
        """Verifica si la promo sigue disponible (stock o tiempo)."""
        if not self.is_active:
            return False
        if self.promo_type == "por_tiempo" and self.valid_until:
            if datetime.utcnow() > datetime.fromisoformat(self.valid_until):
                return False
        if self.promo_type == "por_stock" and self.stock_limit:
            if self.stock_used >= self.stock_limit:
                return False
        return True


@strawberry.type
class PromoCheckResult:
    applicable: bool
    promotion: Optional[Promotion]
    discount_amount: float
    message: str

# ─── QUERIES ──────────────────────────────────────────────────────────────────


@strawberry.type
class Query:
    @strawberry.field
    async def my_points(self, info) -> LoyaltyAccount:
        customer_id = info.context["customer_id"]
        points = await get_points_cached(customer_id)
        return LoyaltyAccount(customer_id=customer_id, total_points=points)

    @strawberry.field
    async def my_point_history(self, info, limit: int = 20) -> List[PointTransaction]:
        customer_id = info.context["customer_id"]
        rows = await database.fetch_all(
            point_transactions_table.select()
            .where(point_transactions_table.c.customer_id == customer_id)
            .order_by(point_transactions_table.c.created_at.desc())
            .limit(limit)
        )
        return [
            PointTransaction(**dict(r), created_at=str(r["created_at"]))
            for r in rows
        ]

    @strawberry.field
    async def active_promotions(
        self,
        restaurant_id: Optional[str] = None
    ) -> List[Promotion]:
        """Devuelve promos activas globales + las del restaurante específico."""
        now = datetime.utcnow()
        query = promotions_table.select().where(
            promotions_table.c.is_active == True
        )
        rows = await database.fetch_all(query)
        promos = []
        for r in rows:
            d = dict(r)
            p = Promotion(
                **{k: str(v) if isinstance(v, datetime) else v for k, v in d.items()}
            )
            # Filtrar por scope
            if p.scope == "global" or (p.scope == "local" and d["scope_id"] == restaurant_id):
                if p.is_available:
                    promos.append(p)
        return promos

    @strawberry.field
    async def check_promo(
        self,
        promo_id: str,
        order_total: float,
        dish_ids: List[str]
    ) -> PromoCheckResult:
        """Verifica si una promo aplica y calcula el descuento."""
        row = await database.fetch_one(
            promotions_table.select().where(promotions_table.c.id == promo_id)
        )
        if not row:
            return PromoCheckResult(applicable=False, promotion=None, discount_amount=0, message="Promo no encontrada")

        d = dict(row)
        promo = Promotion(
            **{k: str(v) if isinstance(v, datetime) else v for k, v in d.items()})

        if not promo.is_available:
            return PromoCheckResult(applicable=False, promotion=promo, discount_amount=0, message="Promo no disponible")

        # Verificar si aplica a los platos del pedido
        if d.get("dish_ids") and not any(dish in d["dish_ids"] for dish in dish_ids):
            return PromoCheckResult(applicable=False, promotion=promo, discount_amount=0, message="La promo no aplica a estos platos")

        # Calcular descuento
        discount = 0.0
        if d["discount_pct"]:
            discount = order_total * (d["discount_pct"] / 100)
        elif d["discount_fixed"]:
            discount = min(d["discount_fixed"], order_total)

        return PromoCheckResult(
            applicable=True,
            promotion=promo,
            discount_amount=round(discount, 2),
            message=f"Promo aplicada: -{discount:.2f}"
        )

# ─── MUTATIONS ────────────────────────────────────────────────────────────────


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_promotion(
        self,
        id: str,
        name: str,
        description: str,
        scope: PromoScope,
        promo_type: PromoType,
        valid_from: str,
        discount_pct: Optional[float] = None,
        discount_fixed: Optional[float] = None,
        scope_id: Optional[str] = None,
        stock_limit: Optional[int] = None,
        valid_until: Optional[str] = None,
        dish_ids: Optional[List[str]] = None,
    ) -> Promotion:
        """Solo admin puede crear promos. El Gateway valida el rol."""
        await database.execute(promotions_table.insert().values(
            id=id,
            name=name,
            description=description,
            scope=scope.value,
            scope_id=scope_id,
            discount_pct=discount_pct,
            discount_fixed=discount_fixed,
            promo_type=promo_type.value,
            stock_limit=stock_limit,
            stock_used=0,
            valid_from=datetime.fromisoformat(valid_from),
            valid_until=datetime.fromisoformat(
                valid_until) if valid_until else None,
            is_active=True,
            dish_ids=dish_ids,
        ))
        row = await database.fetch_one(promotions_table.select().where(promotions_table.c.id == id))
        d = dict(row)
        return Promotion(**{k: str(v) if isinstance(v, datetime) else v for k, v in d.items()})

    @strawberry.mutation
    async def redeem_points(
        self,
        info,
        points_to_redeem: int,
        order_id: str
    ) -> LoyaltyAccount:
        """El cliente canjea puntos en un pedido."""
        customer_id = info.context["customer_id"]
        current_points = await get_points_cached(customer_id)

        if points_to_redeem > current_points:
            raise ValueError("Puntos insuficientes")

        new_total = current_points - points_to_redeem
        now = datetime.utcnow()

        await database.execute(
            loyalty_accounts_table.update()
            .where(loyalty_accounts_table.c.customer_id == customer_id)
            .values(total_points=new_total, updated_at=now)
        )
        await database.execute(point_transactions_table.insert().values(
            customer_id=customer_id,
            order_id=order_id,
            points_delta=-points_to_redeem,
            description=f"Canje en pedido {order_id}",
            created_at=now
        ))
        await invalidate_points_cache(customer_id)
        return LoyaltyAccount(customer_id=customer_id, total_points=new_total)

# ─── CONSUMIDOR RABBITMQ ──────────────────────────────────────────────────────


async def consume_order_completed():
    import asyncio

    connection = None
    for intento in range(10):
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            print(f"[Loyalty Service] Conectado a RabbitMQ ✓")
            break
        except Exception as e:
            print(
                f"[Loyalty Service] RabbitMQ no disponible, reintento {intento+1}/10... ({e})")
            await asyncio.sleep(5)

    if connection is None:
        print("[Loyalty Service] No se pudo conectar a RabbitMQ después de 10 intentos")
        return

    channel = await connection.channel()
    exchange = await channel.declare_exchange("orders", aio_pika.ExchangeType.TOPIC, durable=True)
    queue = await channel.declare_queue("loyalty.order_completed", durable=True)
    await queue.bind(exchange, routing_key="order.completed")

    async def on_message(msg: aio_pika.IncomingMessage):
        async with msg.process():
            data = json.loads(msg.body.decode())
            customer_id = data["customer_id"]
            total = data["total"]
            order_id = data["order_id"]
            promo_id = data.get("promo_id")
            discount = data.get("discount_applied", 0)

            points_earned = int(total)
            now = datetime.utcnow()

            existing = await database.fetch_one(
                loyalty_accounts_table.select()
                .where(loyalty_accounts_table.c.customer_id == customer_id)
            )
            if existing:
                await database.execute(
                    loyalty_accounts_table.update()
                    .where(loyalty_accounts_table.c.customer_id == customer_id)
                    .values(total_points=existing["total_points"] + points_earned, updated_at=now)
                )
            else:
                await database.execute(loyalty_accounts_table.insert().values(
                    customer_id=customer_id,
                    total_points=points_earned,
                    updated_at=now
                ))

            await database.execute(point_transactions_table.insert().values(
                customer_id=customer_id,
                order_id=order_id,
                points_delta=points_earned,
                description=f"Puntos por pedido {order_id}",
                created_at=now
            ))
            await invalidate_points_cache(customer_id)

            if promo_id and discount > 0:
                await database.execute(redemptions_table.insert().values(
                    customer_id=customer_id,
                    promotion_id=promo_id,
                    order_id=order_id,
                    discount_applied=discount,
                    created_at=now
                ))
                await database.execute(
                    promotions_table.update()
                    .where(promotions_table.c.id == promo_id)
                    .values(stock_used=promotions_table.c.stock_used + 1)
                )

            print(f"[Loyalty] +{points_earned} pts para cliente {customer_id}")

    await queue.consume(on_message)
    print("[Loyalty Service] Escuchando eventos order.completed...")

# ─── APP ──────────────────────────────────────────────────────────────────────


async def get_context(x_customer_id: str = None):
    return {"customer_id": x_customer_id}

schema = Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_context)

app = FastAPI(title="RestoHub - Loyalty & Promos Service")
app.include_router(graphql_router, prefix="/graphql")


@app.on_event("startup")
async def startup():
    global redis_client
    await database.connect()
    sync_engine = sqlalchemy.create_engine(
        DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")
    )
    metadata.create_all(sync_engine)
    sync_engine.dispose()
    redis_client = await aioredis.from_url(REDIS_URL)
    import asyncio
    asyncio.create_task(consume_order_completed())


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
    await redis_client.close()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "loyalty-service"}
