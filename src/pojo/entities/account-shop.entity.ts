import { Entity, Column, Unique } from 'typeorm';
import { BaseAccountNameSymbol } from './basse-account.entity';
@Entity('account_shops')
@Unique('unique_accountbook_name', ['accountBookId', 'name'])
export class AccountShop extends BaseAccountNameSymbol {
  @Column({
    type: 'varchar',
    length: 32,
    name: 'parent_id',
    nullable: true,
    comment: '父级商户ID（客户端同步用）',
  })
  parentId: string;
}
