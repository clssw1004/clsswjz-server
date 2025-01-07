import {
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemType } from '../../enums/item-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class QueryAccountItemDto {
  @ApiProperty({
    description: '账本ID',
    example: 'book123',
    required: false,
  })
  @IsOptional()
  accountBookId?: string;

  @ApiProperty({
    description: '分类',
    example: 'food',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: '分类列表',
    type: 'array',
    items: {
      type: 'string',
    },
    example: ['food', 'transport'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiProperty({
    description: '资金账户ID',
    example: 'fund123',
    required: false,
  })
  @IsOptional()
  @IsString()
  fundId?: string;

  @ApiProperty({
    description: '资金账户ID列表',
    type: 'array',
    items: {
      type: 'string',
    },
    example: ['fund123', 'fund456'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  fundIds?: string[];

  @ApiProperty({
    description: '商家编码',
    example: 'shop123',
    required: false,
  })
  @IsOptional()
  @IsString()
  shopCode?: string;

  @ApiProperty({
    description: '商家编码列表',
    type: 'array',
    items: {
      type: 'string',
    },
    example: ['shop123', 'shop456'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  shopCodes?: string[];

  @ApiProperty({
    description: '开始日期',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '结束日期',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '记录类型',
    enum: ItemType,
    example: ItemType.EXPENSE,
    required: false,
  })
  @IsOptional()
  type?: ItemType;

  @ApiProperty({
    description: '最小金额',
    example: 0,
    required: false,
  })
  @IsOptional()
  minAmount?: number;

  @ApiProperty({
    description: '最大金额',
    example: 1000,
    required: false,
  })
  @IsOptional()
  maxAmount?: number;

  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: '每页条数',
    example: 10,
    minimum: 1,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}
