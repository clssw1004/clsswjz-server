import { DataSource, Repository } from 'typeorm';
import { AdminSystemService } from './admin-system.service';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';

describe('AdminSystemService', () => {
  let dataSource: DataSource;
  let logRepo: Repository<LogSync>;
  let service: AdminSystemService;

  const configMock = {
    get: (key: string, def?: any) => {
      const map: Record<string, any> = {
        DB_TYPE: 'mysql',
        DB_HOST: '127.0.0.1',
        DB_DATABASE: 'clsswjz',
        NODE_ENV: 'production',
      };
      return key in map ? map[key] : def;
    },
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [LogSync],
      synchronize: true,
    });
    await dataSource.initialize();
    logRepo = dataSource.getRepository(LogSync);
    service = new AdminSystemService(configMock as any, logRepo);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await logRepo.clear();
  });

  async function makeLog(id: string, at: number, opts: { materialized?: boolean; error?: string }) {
    await logRepo.save(
      logRepo.create({
        id,
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: 'u1',
        operatedAt: at,
        businessId: 'i1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: at,
        materializedAt: opts.materialized ? 1000 : null,
        materializeError: opts.error ?? null,
      } as any),
    );
  }

  it('info reports env, database and replay counts', async () => {
    await makeLog('l1', 1000, { materialized: true });
    await makeLog('l2', 2000, { materialized: false, error: 'boom' });
    await makeLog('l3', 3000, { materialized: false });

    const info = await service.info();

    expect(info.version).toBeTruthy();
    expect(info.node).toBeTruthy();
    expect(info.env).toBe('production');
    expect(info.database.type).toBe('mysql');
    expect(info.database.host).toBe('127.0.0.1');
    expect(info.replay.total).toBe(3);
    expect(info.replay.materialized).toBe(1);
    expect(info.replay.failed).toBe(1);
    expect(info.replay.pending).toBe(1);
  });
});
