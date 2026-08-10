"""FastAPI 入口：路由挂载 + 生命周期 + 全局异常处理。

生产级要点：
- lifespan 初始化可观测（日志/Sentry/LangSmith）
- 全局异常处理：未捕获异常自动上报 Sentry + 返回统一错误格式
- 健康检查端点：用于 k8s/容器探活
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes_stream import router as stream_router
from app.api.routes_tasks import router as tasks_router
from app.core.config import settings
from app.core.redis import redis_client
from app.core.logging import logger
from app import observability


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动：初始化可观测
    observability.init()
    logger.info("FastAPI 启动", env=settings.ENV)
    yield
    # 关闭：清理资源
    await redis_client.aclose()
    logger.info("FastAPI 关闭")


app = FastAPI(
    title="Boom Cat Agent Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(stream_router, prefix="/agent")
app.include_router(tasks_router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理：未捕获异常 → Sentry 上报 + 统一错误响应。

    生产级关键：用户永远不应该看到 500 + 堆栈，而是统一的错误格式。
    """
    logger.bind(
        path=request.url.path,
        method=request.method,
    ).exception("未捕获异常", error=str(exc))

    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_ERROR",
            "message": "服务内部错误，已记录",
            "detail": str(exc) if settings.ENV != "production" else None,
        },
    )


@app.get("/health")
async def health():
    """健康检查端点（k8s/容器探活用）。"""
    return {"status": "ok", "env": settings.ENV}
