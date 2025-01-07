import { IsNotEmpty, IsEnum } from 'class-validator';
import { SymbolType } from '../../enums/symbol-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAccountSymbolDto {
  @ApiProperty({
    description: '账本ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;

  @ApiProperty({
    description: '账本属性类型',
    enum: SymbolType,
    example: SymbolType.TAG,
  })
  @IsNotEmpty({ message: '属性类型不能为空' })
  @IsEnum(SymbolType, { message: '属性类型不正确' })
  symbolType: SymbolType;
}
