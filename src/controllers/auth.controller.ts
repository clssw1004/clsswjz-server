import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public } from '../decorators/public';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  async login(@Body() loginData: { username: string; password: string }) {
    return await this.authService.login(loginData.username, loginData.password);
  }

  @Get('validate')
  async validate(@Request() req) {
    return {
      valid: true,
      user: req.user,
    };
  }
}
