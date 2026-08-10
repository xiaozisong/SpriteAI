"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const sessions_1 = require("./sessions");
exports.messages = (0, pg_core_1.pgTable)('messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    sessionId: (0, pg_core_1.integer)('session_id')
        .notNull()
        .references(() => sessions_1.sessions.id, { onDelete: 'cascade' }),
    role: (0, pg_core_1.varchar)('role', { length: 20 }).notNull(),
    content: (0, pg_core_1.text)('content'),
    extra: (0, pg_core_1.jsonb)('extra').default({}).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=messages.js.map