"""Redis 客户端：会话缓存 / 流式扇出 / Redis Streams 任务队列。"""
import redis.asyncio as aioredis

from app.core.config import settings

redis_client = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
