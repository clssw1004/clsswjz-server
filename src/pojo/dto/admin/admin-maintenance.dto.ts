import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

/** 维护实体类型：分类/商户/标签(项目) */
export type MaintenanceEntityType = 'category' | 'shop' | 'symbol';

const TYPES: MaintenanceEntityType[] = ['category', 'shop', 'symbol'];

export class MaintenanceListQueryDto {
  @ApiProperty({ description: '账本 ID' })
  @IsString()
  bookId: string;

  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  type: MaintenanceEntityType;
}

export class MaintenanceRenameDto {
  @ApiProperty({ description: '账本 ID' })
  @IsString()
  bookId: string;

  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  type: MaintenanceEntityType;

  @ApiProperty({ description: '实体 id' })
  @IsString()
  id: string;

  @ApiProperty({ description: '新名称' })
  @IsString()
  name: string;
}

export class MaintenanceDeleteDto {
  @ApiProperty({ description: '账本 ID' })
  @IsString()
  bookId: string;

  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  type: MaintenanceEntityType;

  @ApiProperty({ type: [String], description: '要删除的实体 id 列表' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class MaintenanceMergeDto {
  @ApiProperty({ description: '账本 ID' })
  @IsString()
  bookId: string;

  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  type: MaintenanceEntityType;

  @ApiProperty({ description: '被合并源实体 id（其引用将改指向 toId）' })
  @IsString()
  fromId: string;

  @ApiProperty({ description: '目标实体 id' })
  @IsString()
  toId: string;
}

export class BookListQueryDto {
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

  @ApiPropertyOptional({ description: '账本名称关键字' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class NoteListQueryDto {
  @ApiProperty({ description: '账本 ID' })
  @IsString()
  bookId: string;

  @ApiPropertyOptional({ enum: ['NOTE', 'TODO', 'REPORT'], description: '类型过滤' })
  @IsOptional()
  @IsIn(['NOTE', 'TODO', 'REPORT'])
  type?: string;

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
