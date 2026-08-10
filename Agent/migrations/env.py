"""Alembic 环境配置骨架。

TODO(M2): 补充 async_engine / async_session 的 async autoflush，以及
          --x-alembic-flag 支持异步迁移。
"""
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.core.db import Base  # noqa: F401 — 需要注册到 `target_metadata`

from alembic import context

config = context.config
if config.config_file_name is not None and config.config_file_name.endswith("alembic.ini"):
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_migrations():
        context.run_migrations()


def do_run_migrations(context) -> None:  # noqa: ARG001
    engine = create_async_engine(settings.DATABASE_URL, poolclass=pool.NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(target_metadata.create_all)


def run_migrations_online() -> None:
    do_run_migrations(context)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
