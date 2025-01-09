import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoginDto } from '../pojo/dto/auth/login.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登录' })
  @Public()
  @Post('login')
  async login(@Body() loginData: LoginDto) {
    return await this.authService.login(loginData);
  }

  @ApiOperation({ summary: '验证当前用户登录状态' })
  @Get('validate')
  async validate(@Request() req) {
    return {
      valid: true,
      user: req.user,
    };
  }
}
