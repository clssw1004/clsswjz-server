import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { RecordType } from '../../enums/record-type.enum';

export class CreateAccountItemDto {
  @IsNotEmpty({ message: '金额不能为空' })
  @IsNumber({}, { message: '金额必须是数字' })
  amount: number;

  @IsNotEmpty({ message: '描述不能为空' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: '类型不能为空' })
  type: RecordType;

  @IsNotEmpty({ message: '分类不能为空' })
  @IsString()
  category: string;

  @IsOptional()
  @IsDateString()
  accountDate?: string;

  @IsNotEmpty({ message: '账本不能为空' })
  @IsString()
  accountBookId: string;
}
