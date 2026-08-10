"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeBases = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.knowledgeBases = (0, pg_core_1.pgTable)('knowledge_bases', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id'),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=knowledge-bases.js.map