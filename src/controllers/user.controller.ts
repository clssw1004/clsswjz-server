import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Request,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '../pojo/entities/user.entity';
import { Public } from '../decorators/public';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('register')
  async register(@Body() userData: Partial<User>) {
    return await this.userService.create(userData);
  }

  @Public()
  @Get('invite/:code')
  async findByInviteCode(@Param('code') inviteCode: string) {
    return await this.userService.findByInviteCode(inviteCode);
  }

  @Put('invite/reset')
  async resetInviteCode(@Request() req) {
    return await this.userService.resetInviteCode(req.user.sub);
  }
}
