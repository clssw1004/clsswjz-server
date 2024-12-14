import {
  PrimaryColumn,
  Column,
  BaseEntity as TypeOrmBaseEntity,
  BeforeInsert,
} from 'typeorm';
import { generatePrimaryKey } from '../../utils/id.util';
import { now } from '../../utils/date.util';

export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryColumn('varchar', {
    length: 32,
    name: 'id',
    comment: '主键ID',
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 19,
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt: string;

  @Column({
    type: 'varchar',
    length: 19,
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt: string;

  @BeforeInsert()
  generateId() {
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
