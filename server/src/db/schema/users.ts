/**
 * users 表：用户。
 *
 * 当前简化版（鉴权阶段 6 补充完整字段）。
 * 对齐 Python 侧：Python 暂无独立 users 表，user_id 是 int，这里补齐。
 */
import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  nickname: varchar('nickname', { length: 100 }),
  // 鉴权字段（阶段 6 补）
  passwordHash: varchar('password_hash', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
