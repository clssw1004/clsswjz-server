import { Entity, Column } from 'typeorm';
import { StringIdEntity } from './base.entity';
import { Transform } from 'class-transformer';

@Entity()
export class Token extends StringIdEntity {
  @Column({ type: 'varchar', length: 32, nullable: false, comment: '用户ID' })
  userId: string;

  @Column({ type: 'text', nullable: false, comment: 'token' })
  token: string;

  @Column({
    type: 'varchar',
    length: 32,
    comment: '客户端ID',
    nullable: true,
  })
  clientId: string;

  @Column({
    type: 'varchar',
    length: 128,
    comment: '客户端名称',
    nullable: true,
  })
  clientName: string;

  @Transform(({ value }) => Number(value))
  @Column({
    type: 'bigint',
    name: 'sign_at',
    comment: '签发时间戳',
    nullable: false,
  })
  signAt: number;
}
