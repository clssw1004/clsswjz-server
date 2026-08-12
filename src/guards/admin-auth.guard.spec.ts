import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthGuard } from '../guards/admin-auth.guard';

describe('AdminAuthGuard', () => {
  let jwtService: JwtService;
  let guard: AdminAuthGuard;

  beforeAll(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
    guard = new AdminAuthGuard(jwtService);
  });

  function makeContext(token?: string) {
    const request: any = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
    return { context, request };
  }

  it('allows a request with a valid admin token and sets request.admin', async () => {
    const token = await jwtService.signAsync({ sub: 'admin', role: 'admin' });
    const { context, request } = makeContext(token);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.admin.role).toBe('admin');
  });

  it('rejects a token without the admin role', async () => {
    const token = await jwtService.signAsync({ sub: 'user-1' });
    const { context } = makeContext(token);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a missing token', async () => {
    const { context } = makeContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid token', async () => {
    const { context } = makeContext('not-a-jwt');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
