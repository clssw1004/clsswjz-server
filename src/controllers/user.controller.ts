import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Request,
  Patch,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '../pojo/entities/user.entity';
import { Public } from '../decorators/public';
import { UpdateUserDto } from '../pojo/dto/user/update-user.dto';

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

  /**
   * 获取当前用户信息
   */
  @Get('current')
  async getCurrentUser(@Request() req) {
    return await this.userService.getCurrentUser(req.user.sub);
  }

  /**
   * 更新用户信息
   */
  @Patch('current')
  async updateUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updateUser(req.user.sub, updateUserDto);
  }
}
