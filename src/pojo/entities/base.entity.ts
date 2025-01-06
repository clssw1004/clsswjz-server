import {
  PrimaryColumn,
  Column,
  BaseEntity as TypeOrmBaseEntity,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { generatePrimaryKey } from '../../utils/id.util';
import { now } from '../../utils/date.util';

export abstract class StringIdEntity extends TypeOrmBaseEntity {
  @PrimaryColumn('varchar', {
    length: 32,
    name: 'id',
    comment: '主键ID',
  })
  id: string;

  @BeforeInsert()
  init() {
    if (!this.id) {
      this.id = generatePrimaryKey();
    }
  }
}

export abstract class BaseEntity extends StringIdEntity {
  @Transform(({ value }) => Number(value))
  @Column({
    type: 'bigint',
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt: number;

  @Transform(({ value }) => Number(value))
  @Column({
    type: 'bigint',
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt: number;

  @BeforeInsert()
  init() {
    if (!this.id) {
      this.id = generatePrimaryKey();
    }
    if (!this.createdAt) {
      this.createdAt = now();
    }
    if (!this.updatedAt) {
      this.updatedAt = now();
    }
  }

  @BeforeUpdate()
  update() {
    this.updatedAt = now();
  }
}

export abstract class BaseBusinessEntity extends BaseEntity {
  @Column({
    length: 32,
    name: 'created_by',
    comment: '创建人ID',
  })
  createdBy: string;

  @Column({
    length: 32,
    name: 'updated_by',
    comment: '更新人ID',
  })
  updatedBy: string;
}

export abstract class BaseBusinessEntityWithAccountBook extends BaseBusinessEntity {
  @Column({
    type: 'varchar',
    length: 32,
    name: 'account_book_id',
    comment: '账本ID',
  })
  accountBookId: string;
}
