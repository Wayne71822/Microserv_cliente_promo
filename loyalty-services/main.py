"""
RestoHub - Loyalty & Promos Service
Actualizado con: Healthcheck, Tasa dinámica de puntos, Configuración Global e Historial.
Versión compatible con Alembic y Python 3.13.
"""
from fastapi import Header, FastAPI
from strawberry.fastapi import GraphQLRouter
from strawberry.federation import Schema
from strawberry.types import Info  # <--- IMPORTANTE: Necesario para tipar 'info'
import strawberry
from typing import Optional, List
import databases
import sqlalchemy
from datetime import datetime
import aio_pika
import json
import redis.asyncio as aioredis
import os
import math

# ─── CONFIG ───────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@loyalty-db:5432/loyalty_db")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# ─── BASE DE DATOS ─────────────────────────────────────────────────────────────

loyalty_accounts_table = sqlalchemy.Table(
    "loyalty_accounts", metadata,
    sqlalchemy.Column("customer_id", sqlalchemy.String, primary_key=True),
    sqlalchemy.Column("total_points", sqlalchemy.Integer, default=0),
    sqlalchemy.Column("updated_at", sqlalchemy.DateTime),
)

loyalty_settings_table = sqlalchemy.Table(
    "loyalty_settings", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("points_per_currency", sqlalchemy.Float, default=1.0),
)

point_transactions_table = sqlalchemy.Table(
    "point_transactions", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer,
                      primary_key=True, autoincrement=True),
    sqlalchemy.Column("customer_id", sqlalchemy.String, index=True),
    sqlalchemy.Column("order_id", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("points_delta", sqlalchemy.Integer),
    sqlalchemy.Column("description", sqlalchemy.String),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime,
                      default=datetime.utcnow),
)

# ─── REDIS ─────────────────────────────────────────────────────────────────────
redis_client: aioredis.Redis = None


async def get_points_cached(customer_id: str) -> int:
    try:
        if redis_client:
            cached = await redis_client.get(f"points:{customer_id}")
            if cached:
                return int(cached)
    except Exception:
        pass

    row = await database.fetch_one(loyalty_accounts_table.select().where(loyalty_accounts_table.c.customer_id == customer_id))
    points = row["total_points"] if row else 0

    try:
        if redis_client:
            await redis_client.setex(f"points:{customer_id}", 300, points)
    except Exception:
        pass
    return points


async def invalidate_points_cache(customer_id: str):
    if redis_client:
        try:
            await redis_client.delete(f"points:{customer_id}")
        except Exception:
            pass

# ─── TIPOS GRAPHQL ─────────────────────────────────────────────────────────────


@strawberry.type
class LoyaltyConfig:
    points_per_currency: float


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
class Query:
    @strawberry.field
    async def loyalty_config(self) -> LoyaltyConfig:
        row = await database.fetch_one(loyalty_settings_table.select().where(loyalty_settings_table.c.id == 1))
        return LoyaltyConfig(points_per_currency=row["points_per_currency"] if row else 1.0)

    @strawberry.field
    async def my_points(self, info: Info) -> LoyaltyAccount:  # <--- CAMBIO: info: Info
        customer_id = info.context["customer_id"]
        points = await get_points_cached(customer_id)
        return LoyaltyAccount(customer_id=customer_id, total_points=points)

    @strawberry.field
    # <--- CAMBIO: info: Info
    async def my_point_history(self, info: Info) -> List[PointTransaction]:
        customer_id = info.context.get("customer_id")
        if not customer_id:
            return []
        query = point_transactions_table.select().where(point_transactions_table.c.customer_id ==
                                                        customer_id).order_by(point_transactions_table.c.created_at.desc())
        rows = await database.fetch_all(query)
        return [PointTransaction(id=r["id"], points_delta=r["points_delta"], description=r["description"], created_at=str(r["created_at"])) for r in rows]


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def update_loyalty_config(self, points: float) -> float:
        query = loyalty_settings_table.select().where(loyalty_settings_table.c.id == 1)
        exists = await database.fetch_one(query)
        if exists:
            await database.execute(loyalty_settings_table.update().where(loyalty_settings_table.c.id == 1).values(points_per_currency=points))
        else:
            await database.execute(loyalty_settings_table.insert().values(id=1, points_per_currency=points))
        return points

# ─── CONSUMIDOR RABBITMQ ──────────────────────────────────────────────────────


async def consume_order_completed():
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        exchange = await channel.declare_exchange("orders", aio_pika.ExchangeType.TOPIC, durable=True)
        queue = await channel.declare_queue("loyalty.order_completed", durable=True)
        await queue.bind(exchange, routing_key="order.completed")

        async def on_message(msg: aio_pika.IncomingMessage):
            async with msg.process():
                data = json.loads(msg.body.decode())
                customer_id = data["customer_id"]
                total_money = data["total"]
                order_id = data["order_id"]

                config = await database.fetch_one(loyalty_settings_table.select().where(loyalty_settings_table.c.id == 1))
                rate = config["points_per_currency"] if config else 1.0
                points_earned = math.floor(total_money * rate)

                if points_earned > 0:
                    existing = await database.fetch_one(loyalty_accounts_table.select().where(loyalty_accounts_table.c.customer_id == customer_id))
                    if existing:
                        await database.execute(loyalty_accounts_table.update().where(loyalty_accounts_table.c.customer_id == customer_id).values(total_points=existing["total_points"] + points_earned, updated_at=datetime.utcnow()))
                    else:
                        await database.execute(loyalty_accounts_table.insert().values(customer_id=customer_id, total_points=points_earned, updated_at=datetime.utcnow()))

                    await database.execute(point_transactions_table.insert().values(
                        customer_id=customer_id, order_id=order_id, points_delta=points_earned,
                        description=f"Puntos ganados por pedido {order_id}", created_at=datetime.utcnow()
                    ))
                    await invalidate_points_cache(customer_id)
                    print(f"[Loyalty] +{points_earned} pts para {customer_id}")

        await queue.consume(on_message)
    except Exception as e:
        print(f"[Error] Fallo en consumidor RabbitMQ: {e}")

# ─── APP SETUP ────────────────────────────────────────────────────────────────

app = FastAPI(title="RestoHub - Loyalty & Promos Service")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "loyalty-service", "timestamp": str(datetime.utcnow())}


async def get_context(x_customer_id: str = Header(default=None)):
    return {"customer_id": x_customer_id}

schema = Schema(query=Query, mutation=Mutation)
app.include_router(GraphQLRouter(
    schema, context_getter=get_context), prefix="/graphql")


@app.on_event("startup")
async def startup():
    global redis_client
    await database.connect()

    # Engine síncrono solo para creación de tablas inicial
    # Nota: Alembic ignorará esto y usará sus propias migraciones
    sync_engine = sqlalchemy.create_engine(
        DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://"))
    metadata.create_all(sync_engine)
    sync_engine.dispose()

    try:
        redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    except Exception as e:
        print(f"[Warning] No se pudo conectar a Redis: {e}")

    import asyncio
    asyncio.create_task(consume_order_completed())


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
    if redis_client:
        await redis_client.close()
