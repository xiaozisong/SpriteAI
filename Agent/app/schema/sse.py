"""SSE 帧封装：把 LangGraph 的流式输出转成前端可解析的 SSE event/data。

与前端 `postLangGraphStream`（src/api/index.ts）的解析协议对齐：
- event: messages/partial, messages/complete, updates, error
"""
import json


def _safe_dumps(data: dict, fallback: dict) -> str:
    """JSON 序列化保险丝：合法数据正常 dumps，非法数据兜底为可提示的错误帧。

    防御性编程：任何上游漏传进来的非 JSON 对象（如 AIMessage）都会在这里被
    兜住，避免整个 SSE 流中断。面试可讲：
    '传输层做了兜底序列化，保证即使某个分支漏网，也只会丢弃该帧而不是切断整条流。'
    """
    try:
        return json.dumps(data, ensure_ascii=False)
    except (TypeError, ValueError):
        # 不能把原始对象吐给前端，用一个安全的错误帧替代
        return json.dumps(fallback, ensure_ascii=False)


def _serialize_value(value):
    """递归地把任意值转成 JSON 可序列化的结构。"""
    # 基础类型直接返回
    if isinstance(value, (str, int, float, bool, type(None))):
        return value
    # 列表递归
    if isinstance(value, list):
        return [_serialize_value(v) for v in value]
    # 字典递归
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    # LangChain 消息对象：映射成 {type, content, tool_calls}
    if hasattr(value, "type") and hasattr(value, "content"):
        return {
            "type": getattr(value, "type", "unknown"),
            "content": getattr(value, "content", ""),
            "tool_calls": getattr(value, "tool_calls", []),
        }
    # 其他对象：转成字符串（保底）
    return str(value)


def _serialize_updates(payload: dict) -> dict:
    """把 updates 里的 LangChain 对象转成可 JSON 序列化的基础结构。

    updates 模式的 payload 可能包含 AIMessage / HumanMessage 等非 JSON 原生对象，
    不能直接 json.dumps。这里把它们递归映射成 {type, content, tool_calls} 结构，
    既避免序列化报错，又保留前端需要的语义信息。
    """
    return _serialize_value(payload)


def sse_block(event: str, data: dict) -> str:
    payload = _safe_dumps(
        data,
        {
            "type": "error",
            "content": "",
            "message": f"[sse] {event} 数据无法序列化，已兜底丢弃",
        },
    )
    return f"event: {event}\ndata: {payload}\n\n"


def sse_done() -> str:
    return "data: [DONE]\n\n"
