"""SSE 流式端点：POST /agent/{agent_id}/stream。

对接 app.agents.registry.AGENTS 中注册的每一个 CompiledStateGraph，
通过 LangGraph astream 把 token / 状态增量转成 SSE 事件推给前端。
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.registry import AGENTS, get_agent, AgentNotFoundError
from app.schema.models import StreamInput
from app.schema.sse import sse_block, sse_done, _serialize_updates

router = APIRouter()


async def _generate(user_input: StreamInput):
    agent = get_agent(user_input.agent_id)
    config = {
        "configurable": {"thread_id": user_input.thread_id},
        # 循环天花板：调大以容纳多轮工具调用（ReAct 一轮 agent+tools 就 2 步）
        "recursion_limit": 30,
    }

    try:
        async for stream_mode, payload in agent.astream(
            {"messages": [{"role": "user", "content": user_input.message}]},
            config=config,
            stream_mode=user_input.stream_mode,
        ):
            if stream_mode == "messages":
                msg, _metadata = payload
                # 只透传 AI 消息的文本增量，忽略 human/tool 等
                if getattr(msg, "type", None) not in ("ai", "AIMessageChunk"):
                    continue
                content = getattr(msg, "content", "") or ""
                if not content:
                    continue
                yield sse_block(
                    "messages/partial",
                    {"type": "ai", "id": getattr(msg, "id", ""), "content": content},
                )
            elif stream_mode == "updates":
                # updates 的 payload 可能含 AIMessage，无法直接 json.dumps
                yield sse_block("updates", _serialize_updates(payload))
    except AgentNotFoundError:
        yield sse_block("error", {"code": "AGENT_NOT_FOUND"})
        return
    except Exception as exc:  # 运行时错误也以 SSE 事件回传，前端可见
        yield sse_block("error", {"message": str(exc)})
        return

    yield sse_block("messages/complete", {"type": "ai", "status": "completed"})
    yield sse_done()


@router.post("/{agent_id}/stream")
async def stream(agent_id: str, user_input: StreamInput):
    if agent_id not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Unknown agent: {agent_id}")
    user_input.agent_id = agent_id
    return StreamingResponse(
        _generate(user_input),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
