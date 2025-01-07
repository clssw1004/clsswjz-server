import { IsOptional, IsString, IsArray, IsNumberString } from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccountItemDto {
  @ApiProperty({
    description: '账本ID',
    example: 'book123',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountBookId?: string;

  @ApiProperty({
    description: '记录ID',
    example: 'item123',
    required: false,
  })
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: '金额',
    example: '100.00',
    required: false,
  })
  @IsOptional()
  @IsNumberString({}, { message: '金额必须是数字' })
  amount?: number;

  @ApiProperty({
    description: '描述',
    example: '午餐',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '类型',
    enum: ItemType,
    example: ItemType.EXPENSE,
    required: false,
  })
  @IsOptional()
  type?: ItemType;

  @ApiProperty({
    description: '分类',
    example: 'food',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: '记账日期',
    example: '2024-01-06',
    required: false,
  })
  @IsOptional()
  accountDate?: string;

  @ApiProperty({
    description: '资金账户ID',
    example: 'fund123',
    required: false,
  })
  @IsOptional()
  fundId?: string;

  @ApiProperty({
    description: '商家',
    example: '全家便利店',
    required: false,
  })
  @IsOptional()
  @IsString()
  shop?: string;

  @ApiProperty({
    description: '要删除的附件ID列表',
    type: 'array',
    items: {
      type: 'string',
    },
    required: false,
  })
  @IsOptional()
  @IsArray()
  deleteAttachmentIds?: string[];

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
