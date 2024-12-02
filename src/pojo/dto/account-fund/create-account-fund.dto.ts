import { IsNotEmpty } from 'class-validator';
import { AccountFund } from '../../entities/account-fund.entity';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAccountFundDto extends PartialType(AccountFund) {
  @IsNotEmpty({ message: '账本ID不能为空' })
  accountBookId: string;
}
