import { Entity, Column, Unique } from 'typeorm';
import { BaseBusinessEntity } from './base.entity';

@Entity('account_shops')
@Unique(['accountBookId', 'name'])
export class AccountShop extends BaseBusinessEntity {
  @Column({
    length: 100,
    name: 'name',
    comment: '商家名称',
  })
  name: string;

  @Column({
    length: 20,
    name: 'shop_code',
    comment: '商家编码',
    unique: true,
  })
  shopCode: string;

  @Column({ 
    name: 'account_book_id',
    comment: '账本ID' 
  })
  accountBookId: string;
}
