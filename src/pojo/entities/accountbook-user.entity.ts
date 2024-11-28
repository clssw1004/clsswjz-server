import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rel_accountbook_users')
export class AccountBookUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '用户ID' })
  userId: string;

  @Column({ comment: '账本ID' })
  accountBookId: string;

  // 账本权限
  @Column({ comment: '查看账本权限', default: true })
  canViewBook: boolean;

  @Column({ comment: '编辑账本权限', default: false })
  canEditBook: boolean;

  @Column({ comment: '删除账本权限', default: false })
  canDeleteBook: boolean;

  // 账目权限
  @Column({ comment: '查看账目权限', default: true })
  canViewItem: boolean;

  @Column({ comment: '编辑账目权限', default: false })
  canEditItem: boolean;

  @Column({ comment: '删除账目权限', default: false })
  canDeleteItem: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
