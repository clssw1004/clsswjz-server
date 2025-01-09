import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  password: string;


  @ApiProperty({
    description: '客户端类型',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  clientType: string;

  @ApiProperty({
    description: '客户端ID',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  clientId: string;

  @ApiProperty({
    description: '客户端名称',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  clientName: string;
}
