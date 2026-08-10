"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generationRuns = exports.RUN_STATUS = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const sessions_1 = require("./sessions");
exports.RUN_STATUS = {
    QUEUED: 'queued',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};
exports.generationRuns = (0, pg_core_1.pgTable)('generation_runs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    sessionId: (0, pg_core_1.integer)('session_id').references(() => sessions_1.sessions.id, { onDelete: 'cascade' }),
    taskId: (0, pg_core_1.varchar)('task_id', { length: 128 }).notNull(),
    agentId: (0, pg_core_1.varchar)('agent_id', { length: 50 }).default('chatbot').notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default(exports.RUN_STATUS.QUEUED).notNull(),
    prompt: (0, pg_core_1.text)('prompt'),
    params: (0, pg_core_1.jsonb)('params').default({}).notNull(),
    result: (0, pg_core_1.jsonb)('result'),
    error: (0, pg_core_1.text)('error'),
    retries: (0, pg_core_1.integer)('retries').default(0).notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    taskIdx: (0, pg_core_1.uniqueIndex)('gen_runs_task_id_idx').on(table.taskId),
    sessionStatusIdx: (0, pg_core_1.index)('gen_runs_session_status_idx').on(table.sessionId, table.status),
}));
//# sourceMappingURL=generation-runs.js.map