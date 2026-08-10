"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.works = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.works = (0, pg_core_1.pgTable)('works', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id'),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    workType: (0, pg_core_1.varchar)('work_type', { length: 50 }).default('novel').notNull(),
    stage: (0, pg_core_1.varchar)('stage', { length: 50 }).default('draft').notNull(),
    extra: (0, pg_core_1.jsonb)('extra').default({}).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=works.js.map