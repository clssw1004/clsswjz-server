import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FundType } from '../../entities/account-fund.entity';

export class CreateAccountFundDto {
  @ApiProperty({
    description: '账本ID',
    example: 'book123',
  })
  @IsNotEmpty({ message: '账本ID不能为空' })
  @IsString()
  accountBookId: string;

  @ApiProperty({
    description: '账户名称',
    example: '工商银行储蓄卡',
  })
  @IsNotEmpty({ message: '账户名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '账户类型',
    enum: FundType,
    example: FundType.DEBIT_CARD,
  })
  @IsNotEmpty({ message: '账户类型不能为空' })
  @IsEnum(FundType)
  fundType: FundType;

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
  })
  @IsNotEmpty({ message: '余额不能为空' })
  @IsNumber()
  fundBalance: number;
}
