/**
 * 操作类型
 */
export enum OperateType {
  /** 更新 */
  UPDATE = 'update',

  /** 创建 */
  CREATE = 'create',

  /** 删除 */
  DELETE = 'delete',

  /** 批量更新 */
  BATCH_UPDATE = 'batchUpdate',

  /** 批量创建 */
  BATCH_CREATE = 'batchCreate',

  /** 批量删除 */
  BATCH_DELETE = 'batchDelete',
}
