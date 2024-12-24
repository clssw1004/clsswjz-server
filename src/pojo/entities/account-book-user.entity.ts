import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rel_accountbook_user')
@Unique('unique_accountbook_user', ['userId', 'accountBookId'])
export class AccountBookUser extends BaseEntity {
  @Column({
    name: 'user_id',
    comment: '用户ID',
  })
  userId: string;

  @Column({
    name: 'account_book_id',
    comment: '账本ID',
  })
  accountBookId: string;

  @Column({
    name: 'can_view_book',
    comment: '查看账本权限',
    default: true,
  })
  canViewBook: boolean;

  @Column({
    name: 'can_edit_book',
    comment: '编辑账本权限',
    default: false,
  })
  canEditBook: boolean;

  @Column({
    name: 'can_delete_book',
    comment: '删除账本权限',
    default: false,
  })
  canDeleteBook: boolean;

  @Column({
    name: 'can_view_item',
    comment: '查看账目权限',
    default: true,
  })
  canViewItem: boolean;

  @Column({
    name: 'can_edit_item',
    comment: '编辑账目权限',
    default: false,
  })
  canEditItem: boolean;

  @Column({
    name: 'can_delete_item',
    comment: '删除账目权限',
    default: false,
  })
  canDeleteItem: boolean;
}
