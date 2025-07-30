import { Injectable, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class SimpleLoggerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // 获取请求对象
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl, ip } = request;

        // 记录请求开始时间
        const startTime = Date.now();

        // 打印请求信息
        console.log(`[${new Date().toISOString()}] INCOMING: ${method} ${originalUrl} from ${ip}`);

        return next.handle().pipe(
            // 处理正常响应
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const duration = Date.now() - startTime;
                console.log(`[${new Date().toISOString()}] OUTGOING: ${method} ${originalUrl} ${response.statusCode} (${duration}ms)`);
            }),
            // 处理错误响应
            catchError((error) => {
                const duration = Date.now() - startTime;
                console.error(`[${new Date().toISOString()}] ERROR: ${method} ${originalUrl} ${error.status || 500} (${duration}ms)`);
                return throwError(() => error);
            })
        );
    }
}
