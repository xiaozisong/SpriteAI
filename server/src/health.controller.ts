/**
 * 健康检查端点：供 docker-compose / k8s 探活用。
 *
 * 对应 Agent 侧 app/main.py 的 /health。
 */
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'boomcat-server',
      env: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
