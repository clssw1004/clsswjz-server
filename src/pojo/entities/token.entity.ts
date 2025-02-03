import { Entity, Column } from 'typeorm';
import { StringIdEntity } from './base.entity';
import { Transform } from 'class-transformer';

@Entity()
export class Token extends StringIdEntity {
  @Column({
    name: 'user_id',
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '用户ID',
  })
  userId: string;

  @Column({
    name: 'token',
    type: 'text',
    nullable: false,
    comment: 'token',
  })
  token: string;

  @Column({
    name: 'client_type',
    type: 'text',
    comment: '客户端类型',
    nullable: true,
  })
  clientType: string;

  @Column({
    name: 'client_id',
    type: 'text',
    comment: '客户端ID',
    nullable: true,
  })
  clientId: string;

  @Column({
    name: 'client_name',
    type: 'text',
    comment: '客户端名称',
    nullable: true,
  })
  clientName: string;

  @Transform(({ value }) => Number(value))
  @Column({
    name: 'sign_at',
    type: 'bigint',
    comment: '签发时间戳',
    nullable: false,
  })
  signAt: number;
}
