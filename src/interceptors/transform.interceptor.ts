import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SKIP_INTERCEPTORS_KEY } from '../decorators/skip-interceptors.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipInterceptors = this.reflector.get<boolean>(
      SKIP_INTERCEPTORS_KEY,
      context.getHandler(),
    );

    if (skipInterceptors) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => ({
        code: response.statusCode || HttpStatus.OK,
        message: 'success',
        data,
      })),
    );
  }
}
