import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FundType } from '../../entities/account-fund.entity';

export class FundBookDto {
  @ApiProperty({
    description: '账本ID',
    example: 'book123',
  })
  @IsString()
  accountBookId: string;

  @ApiProperty({
    description: '是否允许收入',
    example: true,
  })
  @IsBoolean()
  fundIn: boolean;

  @ApiProperty({
    description: '是否允许支出',
    example: true,
  })
  @IsBoolean()
  fundOut: boolean;

  @ApiProperty({
    description: '是否为默认账户',
    example: false,
  })
  @IsBoolean()
  isDefault: boolean;
}

export class UpdateAccountFundDto {
  @ApiProperty({
    description: '账户名称',
    example: '工商银行储蓄卡',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '账户类型',
    enum: FundType,
    example: FundType.DEBIT_CARD,
    required: false,
  })
  @IsOptional()
  @IsEnum(FundType)
  fundType?: FundType;

  @ApiProperty({
    description: '账户备注',
    example: '工资卡',
    required: false,
  })
  @IsOptional()
  @IsString()
  fundRemark?: string;

  @ApiProperty({
    description: '账户余额',
    example: 10000.0,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  fundBalance?: number;

  @ApiProperty({
    description: '是否为默认账户',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
