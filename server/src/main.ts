/**
 * NestJS 入口：启动 + 全局配置。
 *
 * 生产级要点：
 * - ValidationPipe：全局开启 DTO 校验（class-validator）
 * - 全局异常过滤器：统一错误响应
 * - CORS：前端跨域
 * - Swagger：API 文档（开发环境）
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 生产环境关闭 logger，开发用
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // 全局 DTO 校验：whitelist 去除未声明字段，transform 自动转类型
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 全局异常过滤器 + 响应拦截器
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS：前端跨域（开发期前端 5555 → 后端 3000）
  app.enableCors({
    origin: true, // 开发期允许所有来源，生产配白名单
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 NestJS server running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
