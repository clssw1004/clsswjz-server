import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Currency } from '../../enums/currency.enum';

export class CreateAccountBookDto {
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Currency)
  currencySymbol?: Currency;
}
