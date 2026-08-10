"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const works_1 = require("./works");
exports.sessions = (0, pg_core_1.pgTable)('sessions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    workId: (0, pg_core_1.integer)('work_id')
        .notNull()
        .references(() => works_1.works.id, { onDelete: 'cascade' }),
    threadId: (0, pg_core_1.varchar)('thread_id', { length: 128 }),
    model: (0, pg_core_1.varchar)('model', { length: 100 }).default('gpt-4o-mini').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=sessions.js.map