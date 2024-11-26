import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
}
