import { Entity, Column, Unique } from 'typeorm';
import { BaseBusinessEntity } from './base.entity';
import { ItemType } from '../enums/item-type.enum';

@Entity('account_categories')
@Unique(['accountBookId', 'name'])
export class Category extends BaseBusinessEntity {
  @Column({ length: 128, comment: '分类名称' })
  name: string;

  @Column({ comment: '所属账本ID' })
  accountBookId: string;

  @Column({ length: 16, unique: true, comment: '分类编码' })
  code: string;

  @Column({
    type: 'varchar',
    length: 10,
    comment: '分类类型：EXPENSE-支出，INCOME-收入',
  })
  categoryType: ItemType;

  @Column({ nullable: true, comment: '最近账目创建时间' })
  lastAccountItemAt: Date;
}
