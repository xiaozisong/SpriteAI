"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthStates = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.oauthStates = (0, pg_core_1.pgTable)('oauth_states', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    provider: (0, pg_core_1.varchar)('provider', { length: 32 }).notNull(),
    state: (0, pg_core_1.varchar)('state', { length: 255 }).notNull().unique(),
    redirectTo: (0, pg_core_1.varchar)('redirect_to', { length: 1024 }),
    consumedAt: (0, pg_core_1.timestamp)('consumed_at', { withTimezone: true }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=oauth-states.js.map