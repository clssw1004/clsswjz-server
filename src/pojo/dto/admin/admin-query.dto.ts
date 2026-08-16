import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class PageQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize = 20;
}

export class AdminListQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '用户名/昵称关键字' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class AdminLogQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '操作人 ID' })
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ description: '操作类型' })
  @IsOptional()
  @IsString()
  operateType?: string;

  @ApiPropertyOptional({ description: '同步状态' })
  @IsOptional()
  @IsString()
  syncState?: string;

  @ApiPropertyOptional({ description: '起始时间（operatedAt >= startTime）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startTime?: number;

  @ApiPropertyOptional({ description: '结束时间（operatedAt <= endTime）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endTime?: number;
}

export class BookIdQueryDto {
  @ApiPropertyOptional({ description: '账本 ID，缺省统计全平台' })
  @IsOptional()
  @IsString()
  bookId?: string;
}

export class OverviewQueryDto extends BookIdQueryDto {}

export class TrendQueryDto extends BookIdQueryDto {
  @ApiProperty({ enum: ['day', 'month'], default: 'day' })
  @IsIn(['day', 'month'])
  granularity: 'day' | 'month' = 'day';

  @ApiPropertyOptional({ description: '起始日期 yyyy-MM-dd' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: '结束日期 yyyy-MM-dd' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class CategoriesQueryDto extends BookIdQueryDto {
  @ApiProperty({ enum: ['EXPENSE', 'INCOME'] })
  @IsIn(['EXPENSE', 'INCOME'])
  type: 'EXPENSE' | 'INCOME';
}

export class ItemListQueryDto extends PageQueryDto {
  @ApiProperty({ description: '账本 ID（必填，按账本展示账目）' })
  @IsString()
  bookId: string;

  @ApiPropertyOptional({ enum: ['EXPENSE', 'INCOME'], description: '类型过滤' })
  @IsOptional()
  @IsIn(['EXPENSE', 'INCOME'])
  type?: string;

  @ApiPropertyOptional({ description: '分类编码（逗号分隔）' })
  @IsOptional()
  @IsString()
  categoryCodes?: string;

  @ApiPropertyOptional({ description: '账户 ID（逗号分隔）' })
  @IsOptional()
  @IsString()
  fundIds?: string;

  @ApiPropertyOptional({ description: '商户编码（逗号分隔）' })
  @IsOptional()
  @IsString()
  shopCodes?: string;

  @ApiPropertyOptional({ description: '月份 yyyy-MM' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({ enum: ['accountDate', 'amount'], description: '排序字段' })
  @IsOptional()
  @IsIn(['accountDate', 'amount'])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: '排序方向' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
