import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

export class CreateCategoryDto {
  @IsOptional()
  id?: string;

  @IsNotEmpty({ message: '分类名称不能为空' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: '账本ID不能为空' })
  @IsString()
  accountBookId: string;

  @IsNotEmpty({ message: '分类类型不能为空' })
  @IsEnum(ItemType, { message: '分类类型必须是 EXPENSE 或 INCOME' })
  categoryType: ItemType;
}
