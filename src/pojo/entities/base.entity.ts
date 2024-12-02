import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id',
    comment: '主键ID',
  })
  id: string;

  @Column({ comment: '创建人ID' })
  createdBy: string;

  @Column({ comment: '更新人ID' })
  updatedBy: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
