import { Entity, Column } from 'typeorm';
import { ItemType } from '../enums/item-type.enum';
import { BaseBusinessEntity } from './base.entity';

@Entity('account_items')
export class AccountItem extends BaseBusinessEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '金额' })
  amount: number;

  @Column({ length: 100, nullable: true, comment: '描述' })
  description: string;

  @Column({ length: 4, comment: '类型：EXPENSE-支出，INCOME-收入' })
  type: ItemType;

  @Column({ length: 50, comment: '分类编码' })
  categoryCode: string;

  @Column({
    type: 'date',
    comment: '记账日期',
    default: () => 'CURRENT_DATE',
  })
  accountDate: Date;

  @Column({ comment: '账本ID' })
  accountBookId: string;

  @Column({ comment: '账户ID' })
  fundId: string;

  @Column({
    length: 20,
    nullable: true,
    comment: '商家编码',
  })
  shop: string;
}
