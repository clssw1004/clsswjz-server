import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rel_accountbook_funds')
@Unique('unique_accountbook_fund', ['accountBookId', 'fundId'])
export class AccountBookFund extends BaseEntity {
  @Column({
    name: 'account_book_id',
    comment: '账本ID',
  })
  accountBookId: string;

  @Column({
    name: 'fund_id',
    comment: '资产ID',
  })
  fundId: string;

  @Column({
    default: true,
    name: 'fund_in',
    comment: '是否可入账',
  })
  fundIn: boolean;

  @Column({
    default: true,
    name: 'fund_out',
    comment: '是否可出账',
  })
  fundOut: boolean;

  @Column({
    default: false,
    name: 'is_default',
    comment: '是否默认账户',
  })
  isDefault: boolean;
}
