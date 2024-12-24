import { Entity, Column, Unique } from 'typeorm';
import { ItemType } from '../enums/item-type.enum';
import { BaseAccountNameSymbol } from './basse-account.entity';

@Entity('account_categories')
@Unique('unique_accountbook_category', ['accountBookId', 'name'])
export class AccountCategory extends BaseAccountNameSymbol {
  @Column({
    type: 'varchar',
    length: 10,
    name: 'category_type',
    comment: '分类类型：EXPENSE-支出，INCOME-收入',
  })
  categoryType: ItemType;

  @Column({
    nullable: true,
    name: 'last_account_item_at',
    comment: '最近账目创建时间',
  })
  lastAccountItemAt: Date;
}
