import { Controller, Post, Body } from '@nestjs/common';
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
}
