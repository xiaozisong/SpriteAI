import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * oauth_states 表：OAuth 防 CSRF 状态表。
 *
 * 用户点击 QQ/微信登录时，后端生成 state 并保存；
 * 第三方回调时必须带回同一个 state，且只能消费一次。
 */
export const oauthStates = pgTable('oauth_states', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 32 }).notNull(),
  state: varchar('state', { length: 255 }).notNull().unique(),
  // 登录成功后回跳的前端路径，只允许站内路径。
  redirectTo: varchar('redirect_to', { length: 1024 }),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
