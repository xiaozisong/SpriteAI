/**
 * Schema 聚合导出：所有表定义统一从这里 import。
 *
 * 对齐 Python 侧 Agent/app/modules 下的模型：
 * - studio/models.py → works / sessions / messages
 * - generation/models.py → generationTasks
 * - rag/models.py → knowledgeBases / knowledgeChunks
 *
 * 字段类型严格对齐（含 timestamp 时区、vector 维度 1024）。
 */
export * from './users';
export * from './works';
export * from './sessions';
export * from './messages';
export * from './generation-runs';
export * from './knowledge-bases';
export * from './knowledge-chunks';
