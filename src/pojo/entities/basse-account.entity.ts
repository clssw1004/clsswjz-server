import { Column } from 'typeorm';
import { BaseBusinessEntity } from './base.entity';

export abstract class BaseAccountNameSymbol extends BaseBusinessEntity {
  @Column({
    length: 128,
    name: 'name',
    comment: '名称',
  })
  name: string;

  @Column({
    length: 16,
    unique: true,
    name: 'code',
    comment: '编码',
  })
  code: string;

  @Column({
    name: 'account_book_id',
    comment: '所属账本ID',
    length: 32,
  })
  accountBookId: string;
}
