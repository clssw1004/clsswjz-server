import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ description: '管理员用户名' })
  @IsString()
  username: string;

  @ApiProperty({ description: '管理员密码' })
  @IsString()
  password: string;
}
