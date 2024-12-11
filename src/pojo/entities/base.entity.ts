import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity as TypeOrmBaseEntity,
  BeforeInsert,
} from 'typeorm';
import { generatePrimaryKey } from '../../utils/id.util';
import { getColumnTypeForDatabase } from '../../utils/db.util';

export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryColumn('varchar', {
    length: 32,
    comment: '主键ID',
  })
  id: string;

  @CreateDateColumn({
    type: getColumnTypeForDatabase({
      sqlite: 'datetime',
      mysql: 'timestamp',
      postgres: 'timestamp',
    }),
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: getColumnTypeForDatabase({
      sqlite: 'datetime',
      mysql: 'timestamp',
      postgres: 'timestamp',
    }),
    comment: '更新时间',
  })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = generatePrimaryKey();
    }
  }
}

export abstract class BaseBusinessEntity extends BaseEntity {
  @Column({
    length: 32,
    comment: '创建人ID',
  })
  createdBy: string;

  @Column({
    length: 32,
    comment: '更新人ID',
  })
  updatedBy: string;
}
