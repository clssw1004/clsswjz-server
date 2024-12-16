import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsNumberString,
} from 'class-validator';
import { ItemType } from '../../enums/item-type.enum';

export class UpdateAccountItemDto {
  @IsOptional()
  @IsString()
  accountBookId?: string;

  @IsOptional()
  id?: string;

  @IsOptional()
  @IsNumberString({}, { message: '金额必须是数字' })
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  type?: ItemType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  accountDate?: string;

  @IsOptional()
  fundId?: string;

  @IsOptional()
  @IsString()
  shop?: string;

  @IsOptional()
  deleteAttachmentId?: string[];

  @IsOptional()
  @IsArray()
  deleteAttachmentIds?: string[];

  attachments?: Express.Multer.File[];
}
