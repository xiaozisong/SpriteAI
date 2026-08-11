import { integer, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * auth_identities 表：登录身份绑定表。
 *
 * 一个内部用户可以绑定多个外部身份：
 * - email: QQ 邮箱 / Gmail
 * - qq: QQ 互联 openid
 * - wechat: 微信 unionid/openid
 *
 * 这样用户后续换登录方式时，仍然可以映射到同一个 users.id。
 */
export const authIdentities = pgTable(
  'auth_identities',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    provider: varchar('provider', { length: 32 }).notNull(),
    // 当前 provider 下的唯一用户 ID，例如邮箱地址、QQ openid、微信 unionid/openid。
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    unionId: varchar('union_id', { length: 255 }),
    nickname: varchar('nickname', { length: 100 }),
    avatarUrl: varchar('avatar_url', { length: 1024 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // 同一个三方身份只能绑定一个内部用户，避免重复注册。
    providerUserUnique: uniqueIndex('auth_identities_provider_user_unique').on(
      table.provider,
      table.providerUserId,
    ),
  }),
);
