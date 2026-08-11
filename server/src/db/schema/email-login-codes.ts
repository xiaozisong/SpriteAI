import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * email_login_codes 表：邮箱验证码记录。
 *
 * 设计点：
 * - codeHash 只存验证码哈希，不存明文
 * - attempts 限制错误尝试次数，防止暴力猜码
 * - consumedAt 保证验证码只能使用一次
 */
export const emailLoginCodes = pgTable('email_login_codes', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  codeHash: varchar('code_hash', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  attempts: integer('attempts').default(0).notNull(),
  // consumedAt 非空表示验证码已被使用，不能再次登录。
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
