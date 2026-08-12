import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

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
