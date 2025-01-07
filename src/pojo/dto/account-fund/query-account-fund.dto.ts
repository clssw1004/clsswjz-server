import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAccountFundDto {
  @ApiProperty({
    description: '账本ID',
    example: 'book123',
  })
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;

  @ApiProperty({
    description: '账户名称（模糊搜索）',
    example: '工商',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
