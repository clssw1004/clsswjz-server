import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * 管理台鉴权：校验 Bearer JWT 且 payload.role === 'admin' 才放行，并注入 request.admin。
 * 与全局 JwtAuthGuard（普通用户 token）分开；admin 控制器需加 @Public() 跳过全局守卫。
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未提供管理员token');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('无效的管理员token');
    }

    if (payload?.role !== 'admin') {
      throw new UnauthorizedException('无管理员权限');
    }

    request.admin = payload;
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
