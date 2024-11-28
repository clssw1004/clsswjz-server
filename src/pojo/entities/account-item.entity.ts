import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecordType } from '../enums/record-type.enum';

@Entity('account_items')
export class AccountItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '金额' })
  amount: number;

  @Column({ length: 100, comment: '描述' })
  description: string;

  @Column({ length: 4, comment: '类型：EXPENSE-支出，INCOME-收入' })
  type: RecordType;

  @Column({ length: 50, comment: '分类编码' })
  categoryCode: string;

  @Column({
    type: 'date',
    comment: '记账日期',
    default: () => 'CURRENT_DATE',
  })
  accountDate: Date;

  @Column({ comment: '账本ID' })
  accountBookId: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @Column({ comment: '创建人ID' })
  createdBy: string;

  @Column({ comment: '更新人ID' })
  updatedBy: string;
}
