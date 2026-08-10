"""测试：M0/M1 最小闭环（无需数据库 / Redis / LLM key 即可验证路由接线）。"""
import unittest
import os

os.environ.setdefault("OPENAI_API_KEY", "")  # 避免读取 .env 失败

from app.agents.registry import AGENTS, get_agent, AgentNotFoundError
from app.schema.models import StreamInput


class TestRegistry(unittest.TestCase):
    def test_chatbot_present(self):
        self.assertIn("chatbot", AGENTS)

    def test_get_agent_ok(self):
        self.assertIsNotNone(get_agent("chatbot"))

    def test_get_agent_unknown(self):
        with self.assertRaises(AgentNotFoundError):
            get_agent("not_exist")

    def test_stream_input_defaults(self):
        req = StreamInput(message="hi")
        self.assertEqual(req.agent_id, "chatbot")
        self.assertEqual(req.thread_id, "default")


if __name__ == "__main__":
    unittest.main()
