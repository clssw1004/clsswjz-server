import { Entity, Column, Unique, Index } from 'typeorm';
import { StringIdEntity } from './base.entity';
import { BusinessType } from '../enums/business-type.enum';
import { OperateType } from '../enums/operate-type.enum';
import { SyncState } from '../enums/sync-state.enum';

@Entity('log_sync')
@Unique('unique_log_sync', [
  'parentType',
  'parentId',
  'businessType',
  'businessId',
  'operatorId',
  'operatedAt',
])
@Index('idx_operator_sync', ['operatorId', 'syncState', 'syncTime'])
@Index('idx_business_sync', ['businessType', 'syncState', 'syncTime'])
@Index('idx_parent_sync', ['parentType', 'parentId', 'syncState', 'syncTime'])
export class LogSync extends StringIdEntity {
  @Column({
    name: 'business_type',
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '业务类型',
  })
  businessType: BusinessType;

  @Column({
    name: 'operate_type',
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '操作类型',
  })
  operateType: OperateType;

  @Column({
    name: 'parent_type',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: '父级类型',
  })
  parentType: string;

  @Column({
    name: 'parent_id',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: '父级ID',
  })
  parentId: string;

  @Column({
    name: 'operator_id',
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '操作人ID',
  })
  operatorId: string;

  @Column({
    name: 'operated_at',
    type: 'bigint',
    nullable: false,
    comment: '操作时间戳',
  })
  operatedAt: number;

  @Column({
    name: 'business_id',
    comment: '操作数据主键',
  })
  businessId: string;

  @Column({
    name: 'operate_data',
    type: 'text',
    nullable: true,
    comment: '操作数据',
  })
  operateData: string;

  @Column({
    name: 'sync_state',
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '同步状态',
  })
  syncState: SyncState;

  @Column({
    name: 'sync_time',
    type: 'bigint',
    nullable: true,
    comment: '同步时间戳',
  })
  syncTime: number;

  @Column({
    name: 'sync_error',
    type: 'text',
    nullable: true,
    comment: '同步错误信息',
  })
  syncError: string;
}
