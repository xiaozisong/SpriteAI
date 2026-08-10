/**
 * 数据库连接：Drizzle + node-postgres Pool。
 *
 * 对齐 Python 侧 Agent/app/core/db.py 的 async engine + session。
 * - Pool: 连接池（默认 10，生产可调）
 * - db: Drizzle 实例，全局注入
 *
 * 注意：Agent（Python）和 NestJS 共享同一 DB（初期方案）。
 * Agent 直接更新 runs 状态，NestJS 读业务表。
 */
import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DB_TOKEN = 'DB_TOKEN';

/**
 * DbModule：全局提供 Drizzle 实例。
 * - Global: 所有 Module 可注入，无需重复 import
 * - 工厂函数：从环境变量读 DATABASE_URL，创建 Pool + Drizzle
 */
@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      inject: [],
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL is not set');
        }
        const pool = new Pool({
          connectionString,
          max: 10, // 连接池大小
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB_TOKEN],
})
export class DbModule {}
