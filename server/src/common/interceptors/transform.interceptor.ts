/**
 * 统一响应拦截器：所有成功响应包成 { code, data, message }。
 *
 * 对应 Agent 侧的统一错误格式，前后端契约一致。
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        data,
        message: 'ok',
      })),
    );
  }
}
