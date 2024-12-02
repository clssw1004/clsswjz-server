import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QueryAccountFundDto {
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;

  @IsOptional()
  @IsString()
  fundName?: string;
}
