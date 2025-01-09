import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../pojo/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';
import { LoginDto } from 'src/pojo/dto/auth/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tokenService: TokenService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成新token
    const token = await this.tokenService.generateToken(user.id, loginDto);

    return {
      access_token: token,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
    };
  }

  async logout(userId: string, token: string) {
    await this.tokenService.revokeToken(userId, token);
  }
}
