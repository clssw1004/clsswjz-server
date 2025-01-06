import { Entity, Column, Unique } from 'typeorm';
import { StringIdEntity } from './base.entity';
import { BusinessType } from '../enums/business-type.enum';
import { OperateType } from '../enums/operate-type.enum';
import { SyncState } from '../enums/sync-state.enum';

@Entity('log_sync')
@Unique('unique_log_sync', [
  'accountBookId',
  'businessType',
  'businessId',
  'operatorId',
  'operatedAt',
])
export class LogSync extends StringIdEntity {
  @Column({
    type: 'varchar',
    length: 32,
    name: 'account_book_id',
    comment: '账本ID',
  })
  accountBookId: string;

  @Column({
    name: 'operator_id',
    comment: '操作人',
  })
  operatorId: string;

  @Column({
    type: 'bigint',
    name: 'operated_at',
    comment: '操作时间戳',
  })
  operatedAt: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'business_type',
    comment: '操作业务',
  })
  businessType: BusinessType;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'operate_type',
    comment: '操作类型',
  })
  operateType: OperateType;

  @Column({
    name: 'business_id',
    comment: '操作数据主键',
  })
  businessId: string;

  @Column({
    type: 'longtext',
    name: 'operate_data',
    comment: '操作数据json',
  })
  operateData: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'sync_state',
    comment: '同步状态：0-未同步、1-已同步、2-同步中、3-同步失败',
  })
  syncState: SyncState;

  @Column({
    type: 'bigint',
    name: 'sync_time',
    nullable: true,
    comment: '同步时间',
  })
  syncTime: number;

  @Column({
    type: 'text',
    nullable: true,
    name: 'sync_error',
    comment: '同步错误信息',
  })
  syncError: string;
}
