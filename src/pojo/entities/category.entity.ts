import { Entity, Column } from 'typeorm';
import { BaseBusinessEntity } from './base.entity';

@Entity('account_categories')
export class Category extends BaseBusinessEntity {
  @Column({ length: 128, comment: '分类名称' })
  name: string;

  @Column({ comment: '所属账本ID' })
  accountBookId: string;

  @Column({ length: 16, unique: true, comment: '分类编码' })
  code: string;

  @Column({ nullable: true, comment: '最近账目创建时间' })
  lastAccountItemAt: Date;
}
