import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rel_accountbook_funds')
@Unique(['accountBookId', 'fundId'])
export class AccountBookFund extends BaseEntity {
  @Column({ comment: '账本ID' })
  accountBookId: string;

  @Column({ comment: '资产ID' })
  fundId: string;

  @Column({
    default: true,
    comment: '是否可入账',
  })
  fundIn: boolean;

  @Column({
    default: true,
    comment: '是否可出账',
  })
  fundOut: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
