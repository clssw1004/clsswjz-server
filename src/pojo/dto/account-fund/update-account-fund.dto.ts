import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { FundType } from '../../entities/account-fund.entity';

export class FundBookDto {
  @IsString()
  accountBookId: string;

  @IsBoolean()
  fundIn: boolean;

  @IsBoolean()
  fundOut: boolean;

  @IsBoolean()
  isDefault: boolean;
}

export class UpdateAccountFundDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(FundType)
  fundType?: FundType;

  @IsOptional()
  @IsString()
  fundRemark?: string;

  @IsOptional()
  @IsNumber()
  fundBalance?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
