import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('account_shops')
export class AccountShop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    length: 100, 
    comment: '商家名称' 
  })
  name: string;

  @Column({ 
    length: 20, 
    comment: '商家编码',
    unique: true 
  })
  shopCode: string;

  @Column({ comment: '账本ID' })
  accountBookId: string;

  @Column({ comment: '创建人ID' })
  createdBy: string;

  @Column({ comment: '更新人ID' })
  updatedBy: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
} 