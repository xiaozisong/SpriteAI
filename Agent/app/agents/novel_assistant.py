"""novel_assistant：Plan-and-Execute 创作 Agent。

两阶段：
1. planner：生成创作计划（大纲/章节/润色步骤）
2. executor：按计划逐步执行工具，产出内容

对应简历"小说创作平台" + "Plan-and-Solve 范式"。

图结构：
    START
      │
      ▼
  planner ──计划──▶ executor ──(要调工具)──▶ tools
                       │                        │
                       └──(无需工具)──▶ END ◀──(工具结果)──┘
"""
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import START, END, StateGraph
from langgraph.prebuilt import ToolNode

from app.agents.base import AgentState
from app.core.config import settings

# ===================== 常数区 =====================
PLAN_SYSTEM_PROMPT = """\
你是资深小说编辑。请先为用户的创作需求生成一份结构化的分步计划（Plan），
输出格式：
## 创作大纲
1. 主题：...
2. 人物：...
3. 情节：...
注意：这一步只做规划，不写正文。聚焦"先计划、后执行"。
"""

EXEC_SYSTEM_PROMPT = """\
现在开始按计划执行创作。请写出对应章节的正文内容，
可以调用 `write_outline_tool` / `write_chapter_tool` 记录产出。
如果内容已完成且无需更多工具，直接输出最终正文并要求结束。
"""


# ===================== 工具区 =====================
@tool
def write_outline_tool(outline: str) -> str:
    """把创作大纲保存下来。入参是完整大纲文本。"""
    return f"大纲已保存（{len(outline)} 字）"


@tool
def write_chapter_tool(chapter_title: str, content: str) -> str:
    """保存一个章节。chapter_title 章节标题，content 章节正文。"""
    return f"章节《{chapter_title}》已保存（{len(content)} 字）"


# ===================== 构建 =====================
def build_novel_assistant():
    llm = ChatOpenAI(
        model=settings.DEFAULT_MODEL,
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
        streaming=True,
    ).bind_tools([write_outline_tool, write_chapter_tool])

    tools = ToolNode([write_outline_tool, write_chapter_tool])

    def planner_node(state):
        """规划阶段：先生成创作大纲。"""
        response = llm.invoke(
            [{"role": "system", "content": PLAN_SYSTEM_PROMPT}] + state["messages"]
        )
        return {"messages": [response]}

    def executor_node(state):
        """执行阶段：按计划创作正文。"""
        response = llm.invoke(
            [{"role": "system", "content": EXEC_SYSTEM_PROMPT}] + state["messages"]
        )
        return {"messages": [response]}

    def should_continue(state):
        """判断 executor 结束：最后一条 ai 是否还要调工具。"""
        for m in reversed(state["messages"]):
            if getattr(m, "type", "") in ("ai", "AIMessageChunk"):
                return "tools" if m.tool_calls else END
        return END

    graph = StateGraph(AgentState)
    graph.add_node("planner", planner_node)
    graph.add_node("executor", executor_node)
    graph.add_node("tools", tools)

    graph.add_edge(START, "planner")
    graph.add_edge("planner", "executor")
    graph.add_conditional_edges("executor", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "executor")

    return graph.compile()
