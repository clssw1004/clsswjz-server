import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../pojo/entities/token.entity';
import { generateUid } from 'src/utils/id.util';
import { now } from '../utils/date.util';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
  ) {}

  async generateToken(
    userId: string,
    clientId?: string,
    clientName?: string,
  ): Promise<string> {
    // 生成128位随机字符串
    const token = generateUid(128);

    // 保存到数据库
    const tokenEntity = new Token();
    tokenEntity.userId = userId;
    tokenEntity.token = token;
    tokenEntity.clientId = clientId;
    tokenEntity.clientName = clientName;
    tokenEntity.signAt = now();
    await this.tokenRepository.save(tokenEntity);

    return token;
  }

  async validateToken(token: string): Promise<string> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { token },
    });
    return tokenEntity ? tokenEntity.userId : null;
  }

  async revokeToken(userId: string, token: string): Promise<void> {
    await this.tokenRepository.delete({ userId, token });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.delete({ userId });
  }
}
