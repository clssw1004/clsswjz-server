import { IsOptional, IsString, IsDateString, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemType } from '../../enums/item-type.enum';

export class QueryAccountItemDto {
  @IsOptional()
  accountBookId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsString()
  fundId?: string;

  @IsOptional()
  @IsArray()
  fundIds?: string[];

  @IsOptional()
  @IsString()
  shopCode?: string;

  @IsOptional()
  @IsArray()
  shopCodes?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  type?: ItemType;

  @IsOptional()
  minAmount?: number;

  @IsOptional()
  maxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}
