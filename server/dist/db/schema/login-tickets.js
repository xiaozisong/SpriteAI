"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginTickets = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.loginTickets = (0, pg_core_1.pgTable)('login_tickets', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    ticketHash: (0, pg_core_1.varchar)('ticket_hash', { length: 255 }).notNull().unique(),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => users_1.users.id),
    consumedAt: (0, pg_core_1.timestamp)('consumed_at', { withTimezone: true }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=login-tickets.js.map