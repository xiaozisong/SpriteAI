/**
 * drizzle-kit 配置：生成和执行迁移。
 *
 * 对应 Python 侧 Agent/alembic.ini。
 * - schema: Drizzle schema 路径
 * - out: 迁移文件输出目录
 * - dbCredentials: 连接信息（从 .env 读）
 */
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
