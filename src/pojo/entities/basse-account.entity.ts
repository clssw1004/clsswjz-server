import { Column } from 'typeorm';
import { BaseBusinessEntityWithAccountBook } from './base.entity';

export abstract class BaseAccountNameSymbol extends BaseBusinessEntityWithAccountBook {
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
}
