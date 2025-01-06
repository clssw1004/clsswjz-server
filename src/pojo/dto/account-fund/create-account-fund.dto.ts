import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { FundType } from '../../entities/account-fund.entity';

export class CreateAccountFundDto {
  @IsNotEmpty({ message: '账本ID不能为空' })
  @IsString()
  accountBookId: string;

  @IsNotEmpty({ message: '账户名称不能为空' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: '账户类型不能为空' })
  @IsEnum(FundType)
  fundType: FundType;

  @IsOptional()
  @IsString()
  fundRemark?: string;

  @IsNotEmpty({ message: '余额不能为空' })
  @IsNumber()
  fundBalance: number;
}
