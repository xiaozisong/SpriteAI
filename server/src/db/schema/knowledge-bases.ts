/**
 * knowledge_bases 表：知识库（用户上传的文档集合）。
 *
 * 对齐 Python 侧 Agent/app/rag/models.py 的 KnowledgeBase。
 */
import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core';

export const knowledgeBases = pgTable('knowledge_bases', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // 所属用户（nullable，公共库）
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
