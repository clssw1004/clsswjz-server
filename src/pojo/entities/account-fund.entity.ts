import { Entity, Column, Unique } from 'typeorm';
import { BaseBusinessEntity } from './base.entity';
import { ColumnNumericTransformer } from '../transformers';

export enum FundType {
  CASH = 'CASH', // 现金
  DEBIT_CARD = 'DEBIT', // 储蓄卡
  CREDIT_CARD = 'CREDIT', // 信用卡
  PREPAID_CARD = 'PREPAID', // 充值卡
  ALIPAY = 'ALIPAY', // 支付宝
  WECHAT = 'WECHAT', // 微信
  DEBT = 'DEBT', // 欠款
  INVESTMENT = 'INVESTMENT', //
  E_WALLET = 'E_WALLET', // 网络钱包
  OTHER = 'OTHER', // 其他
}

@Entity('account_funds')
@Unique('unique_fund_createby_name', ['createdBy', 'name'])
export class AccountFund extends BaseBusinessEntity {
  @Column({
    length: 50,
    name: 'name',
    comment: '资金来源名称',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'fund_type',
    comment: '资金类型',
  })
  fundType: FundType;

  @Column({
    type: 'text',
    nullable: true,
    name: 'fund_remark',
    comment: '资金备注',
  })
  fundRemark: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'fund_balance',
    comment: '余额',
    transformer: new ColumnNumericTransformer(),
  })
  fundBalance: number;

  @Column({
    name: 'is_default',
    comment: '是否默认账户',
    default: false,
  })
  isDefault: boolean;
}
