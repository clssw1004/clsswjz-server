import { Entity, Column, Unique } from 'typeorm';
import { Currency } from '../enums/currency.enum';
import { BaseEntity } from './base.entity';

@Entity('account_books')
@Unique(['createdBy', 'name'])
export class AccountBook extends BaseEntity {
  @Column({ length: 50, comment: '账本名称' })
  name: string;

  @Column({ length: 200, nullable: true, comment: '账本描述' })
  description: string;

  @Column({
    type: 'varchar',
    default: Currency.CNY,
    comment: '货币符号',
  })
  currencySymbol: Currency;

  @Column({
    nullable: true,
    comment: '账本图标',
  })
  icon?: string;
}
