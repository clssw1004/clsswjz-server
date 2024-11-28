import { IsOptional, IsUUID, IsString, IsDateString } from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

export class QueryAccountItemDto {
  @IsOptional()
  @IsUUID()
  accountBookId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  type?: ItemType;
}
