/**
 * 根模块：聚合所有业务模块。
 *
 * 当前阶段（阶段 2）：只接入 ConfigModule + HealthController，验证脚手架能跑。
 * 后续阶段逐步加 DbModule / UsersModule / WorksModule / RunsModule / AgentClientModule。
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule, DbModule],
  controllers: [HealthController],
})
export class AppModule {}
