"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSessions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.authSessions = (0, pg_core_1.pgTable)('auth_sessions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => users_1.users.id),
    refreshTokenHash: (0, pg_core_1.varchar)('refresh_token_hash', { length: 255 }).notNull(),
    userAgent: (0, pg_core_1.varchar)('user_agent', { length: 512 }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 64 }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=auth-sessions.js.map