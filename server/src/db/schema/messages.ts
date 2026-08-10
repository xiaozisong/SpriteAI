/**
 * messages 表：对话消息（会话内的一条记录）。
 *
 * 对齐 Python 侧 Agent/app/modules/studio/models.py 的 Message。
 * - role: user / assistant / tool
 * - extra: 预留（可存 tool_calls 等）
 */
import { pgTable, serial, integer, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sessions } from './sessions';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // user/assistant/tool
  content: text('content'),
  extra: jsonb('extra').default({}).notNull(), // 预留（tool_calls 等）
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
