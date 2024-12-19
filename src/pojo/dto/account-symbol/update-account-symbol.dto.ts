import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAccountSymbolDto {
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString()
  name: string;
} 