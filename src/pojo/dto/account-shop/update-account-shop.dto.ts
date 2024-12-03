import { IsString, IsNotEmpty, Length } from 'class-validator';

export class UpdateAccountShopDto {
  @IsNotEmpty({ message: '商家名称不能为空' })
  @IsString()
  @Length(1, 100, { message: '商家名称长度必须在1-100个字符之间' })
  name: string;
} 