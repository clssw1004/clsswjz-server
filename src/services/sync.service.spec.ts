import { DataSource, Repository } from 'typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { User } from '../pojo/entities/user.entity';
import { AttachmentEntity } from '../pojo/entities/attachment.entity';
import { SyncService } from './sync.service';
import { LogRunner } from './log-runner';
import { MaterializeService } from './materialize.service';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';

describe('SyncService.push', () => {
  const ALL_ENTITIES = [
    LogSync,
    AccountBook,
    AccountCategory,
    AccountItem,
    AccountShop,
    AccountSymbol,
    AccountFund,
    AccountBookUser,
    User,
    AttachmentEntity,
  ];

  let dataSource: DataSource;
  let service: SyncService;
  let logSyncRepo: Repository<LogSync>;

  const cacheMock = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    exists: jest.fn(),
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ALL_ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();

    logSyncRepo = dataSource.getRepository(LogSync);
    const logRunner = new LogRunner(
      dataSource.getRepository(AccountBook),
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountItem),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountSymbol),
      dataSource.getRepository(AccountFund),
      dataSource.getRepository(AccountBookUser),
      dataSource.getRepository(User),
      dataSource.getRepository(AttachmentEntity),
    );
    const materializeService = new MaterializeService(logSyncRepo, logRunner);
    service = new SyncService(
      logSyncRepo,
      logRunner,
      materializeService,
      {} as any, // userService（push 不使用）
      {} as any, // tokenService
      cacheMock as any,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await logSyncRepo.clear();
    cacheMock.set.mockClear();
  });

  function buildLog(overrides: Partial<LogSync> = {}): LogSync {
    return {
      id: 'log-1',
      businessType: BusinessType.BOOK,
      operateType: OperateType.CREATE,
      parentType: 'book',
      parentId: 'book-1',
      operatorId: 'u1',
      operatedAt: 1000,
      businessId: 'book-1',
      operateData: JSON.stringify({
        id: 'book-1',
        name: '家庭账本',
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: 1000,
        updatedAt: 1000,
      }),
      syncState: SyncState.UNSYNCED,
      syncTime: -1,
      ...overrides,
    } as LogSync;
  }

  it('accepts and saves a log whose operatorId matches the authenticated user', async () => {
    const result = await service.push([buildLog()], 'u1');

    expect(result.results[0].syncState).toBe(SyncState.SYNCED);
    const saved = await logSyncRepo.findOneBy({ id: 'log-1' });
    expect(saved).not.toBeNull();
    expect(saved!.operatorId).toBe('u1');
  });

  it('rejects (without saving) a log whose operatorId does not match the authenticated user', async () => {
    const result = await service.push([buildLog({ operatorId: 'u2' })], 'u1');

    expect(result.results[0].syncState).toBe(SyncState.FAILED);
    expect(result.results[0].syncError).toContain('operatorId');
    const saved = await logSyncRepo.findOneBy({ id: 'log-1' });
    expect(saved).toBeNull();
  });

  it('is idempotent: re-pushing an already-existing log returns success without re-saving', async () => {
    await logSyncRepo.save(buildLog({ syncState: SyncState.SYNCED }));

    const result = await service.push([buildLog()], 'u1');

    expect(result.results[0].syncState).toBe(SyncState.SYNCED);
    expect(await logSyncRepo.count()).toBe(1);
    // 已存在 → 不视为新处理，不缓存 commit
    expect(cacheMock.set).not.toHaveBeenCalled();
  });
});
