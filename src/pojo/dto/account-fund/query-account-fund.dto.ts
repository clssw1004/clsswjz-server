import { IsNotEmpty, IsOptional, IsUUID, IsString } from 'class-validator';

export class QueryAccountFundDto {
  @IsNotEmpty({ message: '账本ID不能为空' })
  @IsUUID()
  accountBookId: string;

  @IsOptional()
  @IsString()
  fundName?: string;
} 