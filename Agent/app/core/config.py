"""应用配置：Pydantic Settings，从 .env / 环境变量读取。"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/boomcat"
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # LLM
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    DEFAULT_MODEL: str = "gpt-4o-mini"

    # Embedding（独立 key/url/模型，维度必须与 EMBEDDING_MODEL 输出一致）
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536
    EMBEDDING_API_KEY: str = ""  # DashScope API key

    # 可观测
    SENTRY_DSN: str = ""
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0
    LANGSMITH_TRACING: bool = False
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "boomcat-agent"

    # 运行环境
    ENV: str = "development"  # development / production

    # 安全
    AUTH_SECRET: str = "change-me"


settings = Settings()
