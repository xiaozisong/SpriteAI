import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * auth_sessions 表：登录会话表。
 *
 * access token 是短期令牌，refresh token 用来后续续期；
 * refresh token 只保存哈希，不保存明文，降低数据库泄露风险。
 */
export const authSessions = pgTable('auth_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
  // 记录设备和 IP，后续可用于“登录设备管理”和风控审计。
  userAgent: varchar('user_agent', { length: 512 }),
  ipAddress: varchar('ip_address', { length: 64 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
