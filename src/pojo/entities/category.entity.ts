import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity('account_categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128, comment: '分类名称' })
  name: string;

  @Column({ comment: '所属账本ID' })
  accountBookId: string;

  @Column({ length: 16, unique: true, comment: '分类编码' })
  code: string;

  @Column({ comment: '创建人ID' })
  createdBy: string;

  @Column({ comment: '更新人ID' })
  updatedBy: string;

  @Column({ nullable: true, comment: '最近账目创建时间' })
  lastAccountItemAt: Date;

}
