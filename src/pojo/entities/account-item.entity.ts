import { Entity, Column, BeforeInsert } from 'typeorm';
import { ItemType } from '../enums/item-type.enum';
import { BaseBusinessEntityWithAccountBook } from './base.entity';
import { nowDateString } from '../../utils/date.util';
import { ColumnNumericTransformer } from '../transformers';

@Entity('account_items')
export class AccountItem extends BaseBusinessEntityWithAccountBook {
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'amount',
    comment: '金额',
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  @Column({
    type: 'text',
    nullable: true,
    name: 'description',
    comment: '描述',
  })
  description: string;

  @Column({
    length: 10,
    name: 'type',
    comment: '类型：EXPENSE-支出，INCOME-收入',
  })
  type: ItemType;

  @Column({
    length: 50,
    name: 'category_code',
    comment: '分类编码',
  })
  categoryCode: string;

  @Column({
    type: 'varchar',
    length: 32,
    name: 'account_date',
    comment: '记账日期',
  })
  accountDate: string;

  @Column({
    name: 'fund_id',
    comment: '账户ID',
  })
  fundId: string;

  @Column({
    length: 20,
    nullable: true,
    name: 'shop_code',
    comment: '商家编码',
  })
  shopCode: string;

  @Column({
    length: 20,
    nullable: true,
    name: 'tag_code',
    comment: '标签编码',
  })
  tagCode: string;

  @Column({
    length: 20,
    nullable: true,
    name: 'project_code',
    comment: '项目编码',
  })
  projectCode: string;

  @BeforeInsert()
  setDefaultDate() {
    if (!this.accountDate) {
      this.accountDate = nowDateString();
    }
  }
}
