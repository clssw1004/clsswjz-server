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
import { Public } from '../decorators/public';
import { UpdateUserDto } from '../pojo/dto/user/update-user.dto';
import { CreateUserDto } from '../pojo/dto/user/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get('invite/:code')
  async findByInviteCode(@Param('code') inviteCode: string) {
    const user = await this.userService.findByInviteCode(inviteCode);
    return {
      ...user,
      userId: user?.id,
    };
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
    const user = await this.userService.getCurrentUser(req.user.sub);
    const userStars = await this.userService.getUserStats(req.user.sub);
    return {
      ...user,
      userId: user?.id,
      ststs:userStars
    };
  }

  /**
   * 更新用户信息
   */
  @Patch('current')
  async updateUser(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updateUser(req.user.sub, updateUserDto);
  }
}
