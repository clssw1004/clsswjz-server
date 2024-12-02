import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity as TypeOrmBaseEntity,
  BeforeInsert,
} from 'typeorm';
import { generatePrimaryKey } from '../../utils/id.util';

export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryColumn('varchar', {
    length: 32,
    comment: '主键ID',
  })
  id: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrimaryKey();
    }
  }
}

export abstract class BaseBusinessEntity extends BaseEntity {
  @Column({ comment: '创建人ID' })
  createdBy: string;

  @Column({ comment: '更新人ID' })
  updatedBy: string;
}
