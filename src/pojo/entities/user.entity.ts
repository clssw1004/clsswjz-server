import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { generateUid } from '../../utils/id.util';
import { BaseEntity } from './base.entity';
import { EntityId } from '../../decorators/entity-id';
import { Language } from '../enums/language.enum';

@Entity('users')
export class User extends BaseEntity {
  @Index('IDX_USER_USERNAME', { unique: true })
  @Column({
    length: 50,
    comment: '用户名',
  })
  username: string;

  @Column({ length: 50, comment: '昵称' })
  nickname: string;

  @Column({ comment: '密码' })
  password: string;

  @Index('IDX_USER_EMAIL', { unique: true })
  @Column({
    length: 100,
    nullable: true,
    comment: '邮箱',
  })
  email: string;

  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone: string;

  @Index('IDX_USER_INVITE_CODE', { unique: true })
  @Column({
    length: 50,
    comment: '邀请码',
  })
  inviteCode: string;

  @EntityId()
  id: string;

  @Column({
    type: 'varchar',
    default: Language.ZH_CN,
    comment: '语言设置',
  })
  language: Language;

  @Column({
    default: 'Asia/Shanghai',
    comment: '时区设置',
  })
  timezone: string;

  @BeforeInsert()
  async beforeInsert() {
    // 合并原有的 hashPassword 和新的 inviteCode 生成
    this.password = await bcrypt.hash(this.password, 10);
    this.inviteCode = `cljz_${generateUid(12)}`;
  }
}
