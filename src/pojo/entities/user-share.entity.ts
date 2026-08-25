import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rel_user_share')
@Unique('uq_user_share', ['ownerUserId', 'targetUserId', 'businessType'])
export class UserShareEntity extends BaseEntity {
  @Column({
    name: 'owner_user_id',
    length: 32,
    comment: '共享发起者用户ID',
  })
  ownerUserId: string;

  @Column({
    name: 'target_user_id',
    length: 32,
    comment: '共享目标用户ID',
  })
  targetUserId: string;

  @Column({
    name: 'business_type',
    length: 50,
    comment: '业务类型',
  })
  businessType: string;

  @Column({
    name: 'is_enabled',
    type: 'boolean',
    default: true,
    comment: '是否启用',
  })
  isEnabled: boolean;
}
