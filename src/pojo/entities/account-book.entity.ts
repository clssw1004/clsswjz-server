import { Entity, Column, Unique } from 'typeorm';
import { Currency } from '../enums/currency.enum';
import { BaseBusinessEntity } from './base.entity';

@Entity('account_books')
@Unique('unique_accountbook_createby_name', ['createdBy', 'name'])
export class AccountBook extends BaseBusinessEntity {
  @Column({
    length: 50,
    name: 'name',
    comment: '账本名称',
  })
  name: string;

  @Column({
    length: 200,
    nullable: true,
    name: 'description',
    comment: '账本描述',
  })
  description: string;

  @Column({
    length: 32,
    nullable: true,
    name: 'default_fund_id',
    comment: '默认资金账户(无特殊作用，新增账目时默认选中的账户)',
  })
  defaultFundId: string;

  @Column({
    type: 'varchar',
    default: Currency.CNY,
    name: 'currency_symbol',
    comment: '货币符号',
  })
  currencySymbol: Currency;

  @Column({
    nullable: true,
    name: 'icon',
    comment: '账本图标',
  })
  icon?: string;
}
