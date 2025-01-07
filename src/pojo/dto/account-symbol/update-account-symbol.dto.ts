import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccountSymbolDto {
  @ApiProperty({
    description: '账本属性名称',
    example: '餐饮',
  })
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString()
  name: string;
}
