import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAccountBookSymbolDto {
  @ApiProperty({
    description: '账本ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;
}
