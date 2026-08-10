/**
 * works 表：作品/项目（用户创作的小说、剧本等）。
 *
 * 对齐 Python 侧 Agent/app/modules/studio/models.py 的 Work。
 * - extra 字段：Python 用 `extra`（避开 SQLAlchemy 保留字 metadata）
 * - work_type / stage：业务状态字段
 */
import { pgTable, serial, integer, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const works = pgTable('works', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // 未登录用户用 visitor_id（nullable）
  title: varchar('title', { length: 255 }).notNull(),
  workType: varchar('work_type', { length: 50 }).default('novel').notNull(), // novel/script/etc
  stage: varchar('stage', { length: 50 }).default('draft').notNull(), // draft/outline/finished
  extra: jsonb('extra').default({}).notNull(), // 预留扩展字段
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
