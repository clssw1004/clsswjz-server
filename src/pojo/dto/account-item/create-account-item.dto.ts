import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumberString,
} from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

export class CreateAccountItemDto {
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;

  @IsNotEmpty({ message: '账户不能为空' })
  fundId: string;

  @IsNotEmpty({ message: '金额不能为空' })
  @IsNumberString()
  amount: number;

  @IsNotEmpty({ message: '类型不能为空' })
  @IsEnum(ItemType)
  type: ItemType;

  @IsNotEmpty({ message: '分类不能为空' })
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  shop?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: '记账日期不能为空' })
  accountDate: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  attachments?: Express.Multer.File[];

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  project?: string;
}
