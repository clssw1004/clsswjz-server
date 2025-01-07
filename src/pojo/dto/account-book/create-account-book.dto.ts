import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../enums/currency.enum';

export class CreateAccountBookDto {
  @ApiProperty({
    description: '账本名称',
    example: '日常开支',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: '账本描述',
    example: '记录日常生活开支',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '货币符号',
    enum: Currency,
    example: Currency.CNY,
  })
  @IsNotEmpty()
  @IsEnum(Currency)
  currencySymbol: Currency;

  @ApiProperty({
    description: '账本图标',
    example: 'wallet',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;
}
