import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { User } from '../pojo/entities/user.entity';
import { Token } from '../pojo/entities/token.entity';
import { TokenService } from '../services/token.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Token])],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
