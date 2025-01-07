import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumberString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemType } from '../../enums/item-type.enum';

export class CreateAccountItemDto {
  @ApiProperty({
    description: '账本ID',
    example: 'book123',
  })
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;

  @ApiProperty({
    description: '资金账户ID',
    example: 'fund123',
  })
  @IsNotEmpty({ message: '账户不能为空' })
  fundId: string;

  @ApiProperty({
    description: '金额',
    example: '100.00',
  })
  @IsNotEmpty({ message: '金额不能为空' })
  @IsNumberString()
  amount: number;

  @ApiProperty({
    description: '类型',
    enum: ItemType,
    example: ItemType.EXPENSE,
  })
  @IsNotEmpty({ message: '类型不能为空' })
  @IsEnum(ItemType)
  type: ItemType;

  @ApiProperty({
    description: '分类',
    example: 'food',
  })
  @IsNotEmpty({ message: '分类不能为空' })
  @IsString()
  category: string;

  @ApiProperty({
    description: '商家',
    example: '全家便利店',
    required: false,
  })
  @IsOptional()
  @IsString()
  shop?: string;

  @ApiProperty({
    description: '描述',
    example: '午餐',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '记账日期',
    example: '2024-01-06',
  })
  @IsNotEmpty({ message: '记账日期不能为空' })
  accountDate: string;

  @ApiProperty({
    description: '创建人ID',
    example: 'user123',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({
    description: '附件列表',
    type: 'array',
    items: {
      type: 'file',
    },
    required: false,
  })
  @IsOptional()
  attachments?: Express.Multer.File[];

  @ApiProperty({
    description: '标签',
    example: '餐饮',
    required: false,
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    description: '项目',
    example: '出差',
    required: false,
  })
  @IsOptional()
  @IsString()
  project?: string;
}
