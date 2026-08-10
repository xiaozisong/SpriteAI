"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeChunks = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vector_1 = require("../vector");
const knowledge_bases_1 = require("./knowledge-bases");
exports.knowledgeChunks = (0, pg_core_1.pgTable)('knowledge_chunks', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    kbId: (0, pg_core_1.integer)('kb_id')
        .notNull()
        .references(() => knowledge_bases_1.knowledgeBases.id, { onDelete: 'cascade' }),
    content: (0, pg_core_1.text)('content').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').default({}).notNull(),
    embedding: (0, vector_1.vector)('embedding', { dim: 1024 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    kbIdx: (0, pg_core_1.index)('knowledge_chunks_kb_id_idx').on(table.kbId),
}));
//# sourceMappingURL=knowledge-chunks.js.map