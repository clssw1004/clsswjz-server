import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { SymbolType } from '../../enums/symbol-type.enum';

export class CreateAccountSymbolDto {
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: '属性类型不能为空' })
  @IsEnum(SymbolType, { message: '属性类型不正确' })
  symbolType: SymbolType;

  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;
} 