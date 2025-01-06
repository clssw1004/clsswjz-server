/**
 * 同步状态
 */
export enum SyncState {
  /** 未同步 */
  UNSYNCED = 'unsynced',

  /** 已同步 */
  SYNCED = 'synced',

  /** 同步中 */
  SYNCING = 'syncing',

  /** 同步失败 */
  FAILED = 'failed',
}
