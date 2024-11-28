import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../enums/currency.enum';

@Entity()
export class AccountBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '账本名称' })
  name: string;

  @Column({ length: 200, nullable: true, comment: '账本描述' })
  description: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @Column({
    type: 'varchar',
    default: Currency.CNY,
    comment: '货币符号',
  })
  currencySymbol: Currency;

  @Column({ comment: '创建人ID' })
  createdBy: string;

  @Column({ comment: '更新人ID' })
  updatedBy: string;
}
