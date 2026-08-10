/**
 * 全局异常过滤器：所有未捕获异常 → 统一 JSON 响应 + 日志。
 *
 * 生产级关键：用户永远不该看到 500 + 堆栈，而是统一错误格式。
 * 对应 Agent 侧 app/main.py 的 global_exception_handler。
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 记录错误（含请求路径，便于排查）
    this.logger.error(
      `${request.method} ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      code: status === HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_ERROR' : 'ERROR',
      message:
        exception instanceof HttpException
          ? exception.message
          : '服务内部错误，已记录',
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
