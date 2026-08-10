/**
 * knowledge_chunks 表：向量块（文档切分后的一段 + 嵌入向量）。
 *
 * 对齐 Python 侧 Agent/app/rag/models.py 的 KnowledgeChunk。
 * - embedding: vector(1024)，必须与 embedding 模型输出一致（qwen3.7 = 1024）
 * - metadata_: Python 用 metadata_（避开保留字），这里用 metadata
 *
 * 注意：Python 侧表已存在数据时，维度必须一致，否则迁移报错。
 */
import { pgTable, serial, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { vector } from '../vector';
import { knowledgeBases } from './knowledge-bases';

export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: serial('id').primaryKey(),
    kbId: integer('kb_id')
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    embedding: vector('embedding', { dim: 1024 }).notNull(), // qwen3.7 = 1024
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // 按 kb 查过滤
    kbIdx: index('knowledge_chunks_kb_id_idx').on(table.kbId),
  }),
);
