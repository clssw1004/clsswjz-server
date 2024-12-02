import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('account_shops')
export class AccountShop extends BaseEntity {
  @Column({
    length: 100,
    comment: '商家名称',
  })
  name: string;

  @Column({
    length: 20,
    comment: '商家编码',
    unique: true,
  })
  shopCode: string;

  @Column({ comment: '账本ID' })
  accountBookId: string;
}
