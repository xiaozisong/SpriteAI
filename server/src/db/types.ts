/**
 * Drizzle 类型导出：方便业务层注入。
 */
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

export { schema };
