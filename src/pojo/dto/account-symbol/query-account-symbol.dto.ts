import { IsNotEmpty, IsEnum } from 'class-validator';
import { SymbolType } from '../../enums/symbol-type.enum';

export class QueryAccountSymbolDto {
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;

  @IsNotEmpty({ message: '属性类型不能为空' })
  @IsEnum(SymbolType, { message: '属性类型不正确' })
  symbolType: SymbolType;
} 