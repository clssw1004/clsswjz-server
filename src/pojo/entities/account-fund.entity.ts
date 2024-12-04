import { Entity, Column, Unique } from 'typeorm';
import { BaseBusinessEntity } from './base.entity';

export enum FundType {
  CASH = 'CASH', // 现金
  DEBIT_CARD = 'DEBIT', // 储蓄卡
  CREDIT_CARD = 'CREDIT', // 信用卡
  PREPAID_CARD = 'PREPAID', // 充值卡
  DEBT = 'DEBT', // 欠款
  E_WALLET = 'E_WALLET', // 网络钱包
}

@Entity('account_funds')
@Unique(['createdBy', 'name'])
export class AccountFund extends BaseBusinessEntity {
  @Column({
    length: 50,
    comment: '资金来源名称',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: '资金类型',
  })
  fundType: FundType;

  @Column({
    type: 'text',
    nullable: true,
    comment: '资金备注',
  })
  fundRemark: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: '余额',
  })
  fundBalance: number;
}
