import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * login_tickets 表：OAuth 回调后的短期一次性登录凭证。
 *
 * 作用：
 * - 避免真实 token 出现在 URL 中
 * - ticket 只有 2 分钟有效
 * - ticket 被消费后立即写 consumedAt，不能重复使用
 */
export const loginTickets = pgTable('login_tickets', {
  id: serial('id').primaryKey(),
  ticketHash: varchar('ticket_hash', { length: 255 }).notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
