import { IsOptional, IsUUID, IsString, IsDateString, IsArray } from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

export class QueryAccountItemDto {
  @IsOptional()
  @IsUUID()
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
}
