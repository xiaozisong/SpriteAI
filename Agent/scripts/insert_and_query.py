"""M2 验证脚本：插入 + 查询 works/sessions/messages 表。

验证 SQLAlchemy 异步 ORM 能正确读写 Postgres。
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.db import async_session, Base, engine
from app.modules.studio.models import Work, Session, Message


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def insert_and_query() -> None:
    # 插入一条 work
    work = Work(
        user_id=1,
        title="测试小说",
        work_type="novel",
        stage="outline",
        extra={"source": "m2_test"},
    )
    async with async_session() as db:
        db.add(work)
        await db.flush()  # 拿到 work.id
        await db.refresh(work)
        print(f"✅ 插入 work: id={work.id}, title={work.title}")

        # 插入一条 session（关联这个 work）
        session = Session(
            work_id=work.id,
            thread_id="thread_m2_test",
            model="gpt-4o-mini",
        )
        db.add(session)
        await db.flush()
        await db.refresh(session)
        print(f"✅ 插入 session: id={session.id}, thread_id={session.thread_id}")

        # 插入一条 user 消息
        user_msg = Message(
            session_id=session.id,
            role="user",
            content="你好，写一个科幻小说的开头。",
            extra={"lang": "zh"},
        )
        db.add(user_msg)
        await db.flush()
        await db.refresh(user_msg)
        print(f"✅ 插入 message: id={user_msg.id}, role={user_msg.role}")

        # 插入一条 assistant 消息
        assistant_msg = Message(
            session_id=session.id,
            role="assistant",
            content="好的，这是一个科幻开头……",
            extra={"model": "gpt-4o-mini"},
        )
        db.add(assistant_msg)
        await db.flush()
        await db.refresh(assistant_msg)
        print(f"✅ 插入 message: id={assistant_msg.id}, role={assistant_msg.role}")

        await db.commit()

    # 查询验证
    async with async_session() as db:
        result = await db.execute(
            select(Work)
            .where(Work.id == work.id)
            .options(
                selectinload(Work.sessions).selectinload(Session.messages)
            )
        )
        work_row = result.scalar_one()
        print(f"\n📖 查询 work: {work_row.title} (id={work_row.id})")
        print(f"   type={work_row.work_type}, stage={work_row.stage}")
        for sess in work_row.sessions:
            print(f"   └─ session (thread_id={sess.thread_id}):")
            for msg in sess.messages:
                print(f"      [{msg.role}] {msg.content}")


async def main() -> None:
    await init_db()
    await insert_and_query()


if __name__ == "__main__":
    asyncio.run(main())
