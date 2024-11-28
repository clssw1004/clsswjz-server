import { IsOptional, IsUUID, IsString } from 'class-validator';

export class QueryCategoryDto {
  @IsUUID()
  accountBookId: string;  // 账本ID为必填

  @IsOptional()
  @IsString()
  name?: string;  // 分类名称可选，用于模糊查询
} 