import { getMetadataArgsStorage } from 'typeorm';
import { LogSync } from './log-sync.entity';

/**
 * 日志回放落库需要 log_sync 记录"该日志是否已回放到业务表"。
 * 这两个列由实体元数据驱动（synchronize: true），因此断言元数据即断言 schema。
 */
describe('LogSync entity', () => {
  const columnNames = () =>
    getMetadataArgsStorage()
      .columns.filter((c) => c.target === LogSync)
      .map((c) => c.options.name);

  it('has materialized_at column to mark logs already replayed', () => {
    expect(columnNames()).toContain('materialized_at');
  });

  it('has materialize_error column to record replay failures', () => {
    expect(columnNames()).toContain('materialize_error');
  });
});
