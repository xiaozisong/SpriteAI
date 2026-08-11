"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authIdentities = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.authIdentities = (0, pg_core_1.pgTable)('auth_identities', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => users_1.users.id),
    provider: (0, pg_core_1.varchar)('provider', { length: 32 }).notNull(),
    providerUserId: (0, pg_core_1.varchar)('provider_user_id', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    unionId: (0, pg_core_1.varchar)('union_id', { length: 255 }),
    nickname: (0, pg_core_1.varchar)('nickname', { length: 100 }),
    avatarUrl: (0, pg_core_1.varchar)('avatar_url', { length: 1024 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    providerUserUnique: (0, pg_core_1.uniqueIndex)('auth_identities_provider_user_unique').on(table.provider, table.providerUserId),
}));
//# sourceMappingURL=auth-identities.js.map