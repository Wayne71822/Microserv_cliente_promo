"""
RestoHub - Customer Service
Microservicio de Cliente
Tecnologías: FastAPI + Strawberry GraphQL (subgrafo Apollo Federation) + SQLAlchemy + PostgreSQL
"""

from fastapi import FastAPI, Depends, HTTPException, Header
from strawberry.fastapi import GraphQLRouter
import strawberry
from strawberry.federation import Schema
from typing import Optional, List
import databases
import sqlalchemy
from datetime import datetime
import httpx
import os
import json
import aio_pika  # RabbitMQ async client

# ─── CONFIG ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:pass@localhost/customer_db")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "your-domain.auth0.com")
LOYALTY_SERVICE_URL = os.getenv(
    "LOYALTY_SERVICE_URL", "http://loyalty-service:8001")

# ─── BASE DE DATOS ────────────────────────────────────────────────────────────
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

customers_table = sqlalchemy.Table(
    "customers", metadata,
    sqlalchemy.Column("id", sqlalchemy.String, primary_key=True),  # auth0 sub
    sqlalchemy.Column("email", sqlalchemy.String, unique=True),
    sqlalchemy.Column("name", sqlalchemy.String),
    sqlalchemy.Column("phone", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("country_id", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("preferred_restaurant_id",
                      sqlalchemy.String, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime,
                      default=datetime.utcnow),
)

order_history_table = sqlalchemy.Table(
    "order_history", metadata,
    sqlalchemy.Column("id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("customer_id", sqlalchemy.String),
    sqlalchemy.Column("restaurant_id", sqlalchemy.String),
    sqlalchemy.Column("total", sqlalchemy.Float),
    sqlalchemy.Column("status", sqlalchemy.String),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime),
)

dish_ratings_table = sqlalchemy.Table(
    "dish_ratings", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer,
                      primary_key=True, autoincrement=True),
    sqlalchemy.Column("customer_id", sqlalchemy.String),
    sqlalchemy.Column("dish_id", sqlalchemy.String),
    sqlalchemy.Column("stars", sqlalchemy.Integer),  # 1-5
    sqlalchemy.Column("comment", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime,
                      default=datetime.utcnow),
)

# ─── TIPOS GRAPHQL (STRAWBERRY + FEDERATION) ─────────────────────────────────


@strawberry.federation.type(keys=["id"])
class Customer:
    id: str
    email: str
    name: str
    phone: Optional[str]
    country_id: Optional[str]
    preferred_restaurant_id: Optional[str]
    created_at: str

    @strawberry.field
    async def order_history(self) -> List["OrderSummary"]:
        rows = await database.fetch_all(
            order_history_table.select()
            .where(order_history_table.c.customer_id == self.id)
            .order_by(order_history_table.c.created_at.desc())
            .limit(50)
        )
        return [OrderSummary(**dict(r)) for r in rows]


@strawberry.type
class OrderSummary:
    id: str
    restaurant_id: str
    total: float
    status: str
    created_at: str


@strawberry.type
class DishRating:
    id: int
    dish_id: str
    stars: int
    comment: Optional[str]

# ─── QUERIES ─────────────────────────────────────────────────────────────────


@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info) -> Optional[Customer]:
        """El cliente autenticado ve su propio perfil."""
        customer_id = info.context["customer_id"]
        row = await database.fetch_one(
            customers_table.select().where(customers_table.c.id == customer_id)
        )
        if not row:
            return None
        return Customer(**dict(row), created_at=str(row["created_at"]))

    @strawberry.field
    async def customer(self, id: str) -> Optional[Customer]:
        """Solo para uso interno de otros servicios vía Federation."""
        row = await database.fetch_one(
            customers_table.select().where(customers_table.c.id == id)
        )
        if not row:
            return None
        return Customer(**dict(row), created_at=str(row["created_at"]))

    @strawberry.field
    async def my_dish_ratings(self, info) -> List[DishRating]:
        customer_id = info.context["customer_id"]
        rows = await database.fetch_all(
            dish_ratings_table.select()
            .where(dish_ratings_table.c.customer_id == customer_id)
        )
        return [DishRating(**dict(r)) for r in rows]

# ─── MUTATIONS ───────────────────────────────────────────────────────────────


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def register_customer(
        self,
        auth0_id: str,
        email: str,
        name: str
    ) -> Customer:
        """Se llama automáticamente tras el login con Auth0 (Auth0 Action/Hook)."""
        exists = await database.fetch_one(
            customers_table.select().where(customers_table.c.id == auth0_id)
        )
        if exists:
            return Customer(**dict(exists), created_at=str(exists["created_at"]))

        await database.execute(customers_table.insert().values(
            id=auth0_id, email=email, name=name
        ))
        row = await database.fetch_one(
            customers_table.select().where(customers_table.c.id == auth0_id)
        )
        return Customer(**dict(row), created_at=str(row["created_at"]))

    @strawberry.mutation
    async def update_profile(
        self,
        info,
        country_id: Optional[str] = None,
        preferred_restaurant_id: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> Customer:
        customer_id = info.context["customer_id"]
        updates = {}
        if country_id:
            updates["country_id"] = country_id
        if preferred_restaurant_id:
            updates["preferred_restaurant_id"] = preferred_restaurant_id
        if phone:
            updates["phone"] = phone

        await database.execute(
            customers_table.update()
            .where(customers_table.c.id == customer_id)
            .values(**updates)
        )
        row = await database.fetch_one(
            customers_table.select().where(customers_table.c.id == customer_id)
        )
        return Customer(**dict(row), created_at=str(row["created_at"]))

    @strawberry.mutation
    async def rate_dish(
        self,
        info,
        dish_id: str,
        stars: int,
        comment: Optional[str] = None
    ) -> DishRating:
        """El cliente valora un plato (1-5 estrellas)."""
        customer_id = info.context["customer_id"]
        if not 1 <= stars <= 5:
            raise ValueError("Las estrellas deben ser entre 1 y 5")

        result = await database.execute(dish_ratings_table.insert().values(
            customer_id=customer_id,
            dish_id=dish_id,
            stars=stars,
            comment=comment
        ))
        row = await database.fetch_one(
            dish_ratings_table.select().where(dish_ratings_table.c.id == result)
        )
        return DishRating(**dict(row))

# ─── CONTEXT (extrae customer_id del JWT validado por el Gateway) ─────────────


async def get_context(x_customer_id: str = Header(default=None)):
    """
    El Apollo Gateway valida el JWT de Auth0 y reenvía el customer_id
    como header interno. Nunca llega sin validar al servicio.
    """
    return {"customer_id": x_customer_id}

# ─── CONSUMIDOR RABBITMQ ──────────────────────────────────────────────────────


async def consume_order_events():
    import asyncio

    # ── Reintentos de conexión ──────────────────────────────────────
    connection = None
    for intento in range(10):
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            print(f"[Customer Service] Conectado a RabbitMQ ✓")
            break
        except Exception as e:
            print(
                f"[Customer Service] RabbitMQ no disponible, reintento {intento+1}/10... ({e})")
            await asyncio.sleep(5)

    if connection is None:
        print("[Customer Service] No se pudo conectar a RabbitMQ después de 10 intentos")
        return

    # ── Configurar canal, exchange y cola ───────────────────────────
    channel = await connection.channel()
    exchange = await channel.declare_exchange("orders", aio_pika.ExchangeType.TOPIC, durable=True)
    queue = await channel.declare_queue("customer.order_history", durable=True)
    await queue.bind(exchange, routing_key="order.completed")

    # ── Callback del mensaje ────────────────────────────────────────
    async def on_message(message: aio_pika.IncomingMessage):
        async with message.process():
            data = json.loads(message.body.decode())
            await database.execute(order_history_table.insert().values(
                id=data["order_id"],
                customer_id=data["customer_id"],
                restaurant_id=data["restaurant_id"],
                total=data["total"],
                status="completed",
                created_at=datetime.fromisoformat(data["completed_at"])
            ))
            print(
                f"[Customer Service] Historial actualizado para cliente {data['customer_id']}")

    await queue.consume(on_message)
    print("[Customer Service] Escuchando eventos order.completed...")

# ─── APP FASTAPI ──────────────────────────────────────────────────────────────

schema = Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema, context_getter=get_context)

app = FastAPI(title="RestoHub - Customer Service")
app.include_router(graphql_router, prefix="/graphql")


@app.on_event("startup")
async def startup():
    await database.connect()
    # Crear todas las tablas si no existen
    engine = sqlalchemy.create_engine(DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://"))
    metadata.create_all(engine)
    engine.dispose()
    import asyncio
    asyncio.create_task(consume_order_events())


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "customer-service"}
