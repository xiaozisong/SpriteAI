/**
 * pgvector 自定义类型：Drizzle 没原生 vector，用 customType 实现。
 *
 * 对应 Python 侧 app/rag/vector_type.py 的 Vector。
 * 维度必须和 embedding 模型输出一致（qwen3.7 = 1024）。
 */
import { customType } from 'drizzle-orm/pg-core';

/**
 * vector(n)：pgvector 的固定维度向量类型。
 * - dataType: DDL 生成 `vector(1024)`
 * - toDriver: JS number[] → Postgres 字符串 `[0.1,0.2,...]`
 * - fromDriver: Postgres 返回字符串 → JS number[]
 */
export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dim: number };
}>({
  dataType(config) {
    return config ? `vector(${config.dim})` : 'vector';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    // Postgres 返回形如 "[0.1,0.2,0.3]" 的字符串
    if (!value) return [];
    const cleaned = value.replace(/[[\]\s]/g, '');
    return cleaned.split(',').filter(Boolean).map(Number);
  },
});
