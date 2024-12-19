import { IsNotEmpty } from 'class-validator';

export class QueryAccountBookSymbolDto {
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;
} 