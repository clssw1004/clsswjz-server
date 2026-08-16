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
import { AccountNote } from '../pojo/entities/account-note.entity';
import { LogRunner } from './log-runner';
import { MaterializeService } from './materialize.service';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';

/**
 * MaterializeService 用真实内存 SQLite + 真实 LogRunner 测试，
 * 验证"日志回放落到业务表"的真实行为，不 mock 仓储层。
 */
describe('MaterializeService', () => {
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
    AccountNote,
  ];

  let dataSource: DataSource;
  let service: MaterializeService;
  let logSyncRepo: Repository<LogSync>;
  let accountBookRepo: Repository<AccountBook>;
  let itemRepo: Repository<AccountItem>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ALL_ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();

    logSyncRepo = dataSource.getRepository(LogSync);
    accountBookRepo = dataSource.getRepository(AccountBook);
    itemRepo = dataSource.getRepository(AccountItem);
    userRepo = dataSource.getRepository(User);

    const logRunner = new LogRunner(
      accountBookRepo,
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountItem),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountSymbol),
      dataSource.getRepository(AccountFund),
      dataSource.getRepository(AccountBookUser),
      userRepo,
      dataSource.getRepository(AttachmentEntity),
    );
    service = new MaterializeService(logSyncRepo, logRunner);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  // 各测试共享同一内存库，需清表隔离
  beforeEach(async () => {
    await logSyncRepo.clear();
    await accountBookRepo.clear();
    await userRepo.clear();
  });

  async function insertLog(partial: Partial<LogSync>): Promise<LogSync> {
    const log = logSyncRepo.create({
      id: partial.id,
      businessType: partial.businessType ?? BusinessType.BOOK,
      operateType: partial.operateType ?? OperateType.CREATE,
      parentType: partial.parentType ?? 'book',
      parentId: partial.parentId,
      operatorId: partial.operatorId ?? 'u1',
      operatedAt: partial.operatedAt ?? Date.now(),
      businessId: partial.businessId,
      operateData: partial.operateData ?? '{}',
      syncState: partial.syncState ?? SyncState.SYNCED,
      syncTime: partial.syncTime ?? Date.now(),
    });
    return await logSyncRepo.save(log);
  }

  function bookCreateLog(bookId: string, at: number) {
    return {
      id: `log-${bookId}-create`,
      businessType: BusinessType.BOOK,
      operateType: OperateType.CREATE,
      parentId: bookId,
      businessId: bookId,
      operatedAt: at,
      operateData: JSON.stringify({
        id: bookId,
        name: `账本${bookId}`,
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: at,
        updatedAt: at,
      }),
    };
  }

  it('replays a pending book create log into account_books and marks it materialized', async () => {
    await insertLog(bookCreateLog('book1', 1000));

    const result = await service.flush();

    expect(result.processed).toBe(1);
    const book = await accountBookRepo.findOneBy({ id: 'book1' });
    expect(book).not.toBeNull();
    expect(book!.name).toBe('账本book1');
    const log = await logSyncRepo.findOneBy({ id: 'log-book1-create' });
    expect(log!.materializedAt).not.toBeNull();
  });

  it('is idempotent: a second flush does not re-apply already materialized logs', async () => {
    await insertLog(bookCreateLog('book2', 1000));

    await service.flush();
    const second = await service.flush();

    expect(second.processed).toBe(0);
    expect(await accountBookRepo.count()).toBe(1);
  });

  it('applies logs in operated_at order so create-then-delete yields no row', async () => {
    await insertLog(bookCreateLog('book3', 100));
    await insertLog({
      id: 'log-book3-delete',
      businessType: BusinessType.BOOK,
      operateType: OperateType.DELETE,
      parentId: 'book3',
      businessId: 'book3',
      operatedAt: 200,
      operateData: '{}',
    });

    await service.flush();

    expect(await accountBookRepo.count()).toBe(0);
  });

  it('marks USER logs as materialized without re-creating the user (already applied in processLog)', async () => {
    await insertLog({
      id: 'log-user-profile',
      businessType: BusinessType.USER,
      parentType: 'root',
      parentId: 'NONE',
      businessId: 'user-1',
      operateData: JSON.stringify({
        id: 'user-1',
        username: 'alice',
        nickname: 'Alice',
        password: 'hash',
      }),
    });

    const result = await service.flush();

    expect(result.processed).toBe(1);
    // USER 不应被再次回放（否则会重复建用户/二次 bcrypt）
    expect(await userRepo.count()).toBe(0);
    const log = await logSyncRepo.findOneBy({ id: 'log-user-profile' });
    expect(log!.materializedAt).not.toBeNull();
  });

  it('skips unsupported business types (marks materialized) without blocking others', async () => {
    await insertLog({
      id: 'log-note',
      businessType: 'debt' as unknown as BusinessType, // 服务端枚举不支持的扩展类型
      operateType: OperateType.CREATE,
      parentId: 'book4',
      businessId: 'note-1',
      operatedAt: 100,
      operateData: '{}',
    });
    await insertLog(bookCreateLog('book4', 200));

    const result = await service.flush();

    expect(result.failed).toBe(0);
    expect(result.processed).toBe(2);
    // 不支持的日志被跳过：打上 materialized_at（不再重试）并记录原因
    const skippedLog = await logSyncRepo.findOneBy({ id: 'log-note' });
    expect(skippedLog!.materializedAt).not.toBeNull();
    expect(skippedLog!.materializeError).toContain('不支持的业务类型');
    // 后续日志不受阻塞
    expect(await accountBookRepo.findOneBy({ id: 'book4' })).not.toBeNull();
  });

  it('shares one in-flight flush across concurrent calls to avoid double replay', async () => {
    await insertLog(bookCreateLog('book5', 1000));
    await insertLog(bookCreateLog('book6', 1000));

    const [a, b] = await Promise.all([service.flush(), service.flush()]);

    // 并发调用共享同一次回放，返回同一结果；不会重复落库
    expect(a.processed).toBe(b.processed);
    expect(await accountBookRepo.count()).toBe(2);
  });

  function itemCreateLog(itemId: string, bookId: string, at: number) {
    return {
      id: `log-${itemId}-create`,
      businessType: BusinessType.ITEM,
      operateType: OperateType.CREATE,
      parentId: bookId,
      businessId: itemId,
      operatedAt: at,
      operateData: JSON.stringify({
        id: itemId,
        amount: 10,
        type: 'EXPENSE',
        accountBookId: bookId,
        categoryCode: 'c1',
        fundId: 'f1',
        accountDate: '2026-08-01 12:00:00',
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: at,
        updatedAt: at,
      }),
    };
  }

  it('reset clears business tables and replay markers, then flush rebuilds everything from logs', async () => {
    // 先正常回放 book + item
    await insertLog(bookCreateLog('book1', 1000));
    await insertLog(itemCreateLog('item1', 'book1', 2000));
    await service.flush();
    expect(await accountBookRepo.count()).toBe(1);
    expect(await itemRepo.count()).toBe(1);

    // 重置：业务表清空 + 回放标记清除
    await service.reset();
    expect(await accountBookRepo.count()).toBe(0);
    expect(await itemRepo.count()).toBe(0);
    const marked = await logSyncRepo.findOneBy({ id: 'log-book1-create' });
    expect(marked!.materializedAt).toBeNull();

    // 重新回放：从日志完整重建
    const result = await service.flush();
    expect(result.processed).toBe(2);
    expect(await accountBookRepo.count()).toBe(1);
    const item = await itemRepo.findOneBy({ id: 'item1' });
    expect(item).not.toBeNull();
    expect(item!.accountBookId).toBe('book1');
  });

  it('reset does not clear users or non-synced logs', async () => {
    // USER 日志已回放标记；用户表不受 reset 影响
    await insertLog({
      id: 'log-user-reset',
      businessType: BusinessType.USER,
      parentType: 'root',
      parentId: 'NONE',
      businessId: 'user-1',
      operateData: JSON.stringify({
        id: 'user-1',
        username: 'a',
        password: 'x',
      }),
    });
    // 一个 failed 日志（不属于 synced，不应被清除标记）
    await insertLog({
      id: 'log-failed-reset',
      businessType: BusinessType.BOOK,
      operateType: OperateType.CREATE,
      parentId: 'book-f',
      businessId: 'book-f',
      operateData: '{}',
      syncState: SyncState.FAILED,
    });
    await service.flush();
    expect(await userRepo.count()).toBe(0);

    await service.reset();

    expect(await userRepo.count()).toBe(0);
    const failed = await logSyncRepo.findOneBy({ id: 'log-failed-reset' });
    expect(failed!.materializedAt).toBeNull();
  });

  it('isolates a failing log within a batch so the rest still materialize', async () => {
    await insertLog(bookCreateLog('book9', 1000));
    await insertLog({
      id: 'log-bad-json',
      businessType: BusinessType.ITEM,
      operateType: OperateType.CREATE,
      parentId: 'book9',
      businessId: 'item-bad',
      operatedAt: 2000,
      operateData: '{invalid json', // JSON.parse 失败 → 回放失败
    });
    await insertLog(bookCreateLog('book10', 3000));

    const result = await service.flush();

    // 批量事务失败后降级逐条：只有坏日志失败，其它照常落库
    expect(result.failed).toBe(1);
    expect(result.processed).toBe(2);
    expect(await accountBookRepo.count()).toBe(2);
    const bad = await logSyncRepo.findOneBy({ id: 'log-bad-json' });
    expect(bad!.materializeError).toBeTruthy();
    expect(bad!.materializedAt).toBeNull();
  });
});
