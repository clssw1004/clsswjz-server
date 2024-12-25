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
    name: 'username',
    comment: '用户名',
  })
  username: string;

  @Column({
    length: 50,
    name: 'nickname',
    comment: '昵称',
  })
  nickname: string;

  @Column({
    name: 'password',
    comment: '密码',
  })
  password: string;

  @Column({
    length: 100,
    nullable: true,
    name: 'email',
    comment: '邮箱',
  })
  email: string;

  @Column({
    length: 20,
    nullable: true,
    name: 'phone',
    comment: '手机号',
  })
  phone: string;

  @Index('IDX_USER_INVITE_CODE', { unique: true })
  @Column({
    length: 50,
    name: 'invite_code',
    comment: '邀请码',
  })
  inviteCode: string;

  @EntityId()
  id: string;

  @Column({
    type: 'varchar',
    default: Language.ZH_CN,
    name: 'language',
    comment: '语言设置',
  })
  language: Language;

  @Column({
    default: 'Asia/Shanghai',
    name: 'timezone',
    comment: '时区设置',
  })
  timezone: string;

  @BeforeInsert()
  async beforeInsert() {
    this.password = await bcrypt.hash(this.password, 10);
    this.inviteCode = `cljz_${generateUid(12)}`;
  }

  /**
   * 获取脱敏后的用户信息
   * @param currentUserId 当前登录用户ID，如果是查看自己的信息则不脱敏
   * @returns 脱敏后的用户信息
   */
  toSafeObject(currentUserId?: string): User {
    // 如果是查看自己的信息，返回完整信息（不包含密码）
    if (currentUserId && currentUserId === this.id) {
      return this;
    }

    // 对其他用户信息进行脱敏
    return {
      ...this,
      password: this.maskPassword(this.password),
      username: this.maskUsername(this.username),
      email: this.maskEmail(this.email),
      phone: this.maskPhone(this.phone),
    };
  }

  /**
   * 用户名脱敏：保留首尾字符，中间用*代替
   */
  private maskUsername(username: string): string {
    return `******`;
  }

  /**
   * 邮箱脱敏：显示前3个字符和@后面的域名
   */
  private maskEmail(email: string): string {
    return `******`;
  }

  /**
   * 手机号脱敏：保留前3位和后4位，中间用*代替
   */
  private maskPhone(phone: string): string {
    return `******`;
  }

  private maskPassword(password: string): string {
    return '********';
  }
}
