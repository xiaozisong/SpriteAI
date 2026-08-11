"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailLoginCodes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.emailLoginCodes = (0, pg_core_1.pgTable)('email_login_codes', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    codeHash: (0, pg_core_1.varchar)('code_hash', { length: 255 }).notNull(),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 64 }),
    attempts: (0, pg_core_1.integer)('attempts').default(0).notNull(),
    consumedAt: (0, pg_core_1.timestamp)('consumed_at', { withTimezone: true }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=email-login-codes.js.map