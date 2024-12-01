import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Currency } from '../../enums/currency.enum';

export class CreateAccountBookDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(Currency)
  currencySymbol: Currency;

  @IsOptional()
  @IsString()
  icon?: string;
}
