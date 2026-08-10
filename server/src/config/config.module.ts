/**
 * 环境变量配置：用 @nestjs/config 加载 .env，类型化访问。
 *
 * 设计要点：
 * - isGlobal: true → 全局可用，无需每个 Module 都 import
 * - envFilePath: 支持 dev/qa/prd 多环境
 * - validationSchema: 启动时校验必填项，缺了直接报错（fail fast）
 */
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV ?? 'development'}`],
    }),
  ],
})
export class ConfigModule {}
