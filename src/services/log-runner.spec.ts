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
import { LogRunner } from './log-runner';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';

describe('LogRunner', () => {
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
  let logRunner: LogRunner;
  let itemRepo: Repository<AccountItem>;
  let attachmentRepo: Repository<AttachmentEntity>;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ALL_ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();

    itemRepo = dataSource.getRepository(AccountItem);
    attachmentRepo = dataSource.getRepository(AttachmentEntity);
    logRunner = new LogRunner(
      dataSource.getRepository(AccountBook),
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountItem),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountSymbol),
      dataSource.getRepository(AccountFund),
      dataSource.getRepository(AccountBookUser),
      dataSource.getRepository(User),
      attachmentRepo,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await attachmentRepo.clear();
    await itemRepo.clear();
  });

  function makeLog(partial: {
    businessType: BusinessType;
    operateType?: OperateType;
    businessId: string;
    operateData?: string;
  }): LogSync {
    return {
      id: `log-${partial.businessType}-${partial.businessId}`,
      businessType: partial.businessType,
      operateType: partial.operateType ?? OperateType.CREATE,
      parentType: 'book',
      parentId: 'book-x',
      operatorId: 'u1',
      operatedAt: 1000,
      businessId: partial.businessId,
      operateData: partial.operateData ?? '{}',
      syncState: SyncState.SYNCED,
      syncTime: 1000,
    } as LogSync;
  }

  it('replays attachment create into the attachment table', async () => {
    const log = makeLog({
      businessType: BusinessType.ATTACHMENT,
      businessId: 'att-1',
      operateData: JSON.stringify({
        id: 'att-1',
        originName: 'receipt.jpg',
        fileLength: 1024,
        extension: 'jpg',
        contentType: 'image/jpeg',
        businessCode: 'item',
        businessId: 'item-1',
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: 1000,
        updatedAt: 1000,
      }),
    });

    const result = await logRunner.runLogSync(log, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    const row = await attachmentRepo.findOneBy({ id: 'att-1' });
    expect(row).not.toBeNull();
    expect(row!.originName).toBe('receipt.jpg');
  });

  it('no-ops for the ROOT pseudo type and reports success', async () => {
    const log = makeLog({
      businessType: BusinessType.ROOT,
      businessId: 'root-1',
    });

    const result = await logRunner.runLogSync(log, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
  });

  it('no-ops for FUND_BOOK (no server-side entity yet) and reports success', async () => {
    const log = makeLog({
      businessType: BusinessType.FUND_BOOK,
      businessId: 'fb-1',
    });

    const result = await logRunner.runLogSync(log, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
  });

  it('supports() is true for known server types and false for client-only types', () => {
    expect(logRunner.supports(BusinessType.ITEM)).toBe(true);
    expect(logRunner.supports(BusinessType.ATTACHMENT)).toBe(true);
    expect(logRunner.supports(BusinessType.ROOT)).toBe(true);
    expect(logRunner.supports('note' as unknown as BusinessType)).toBe(false);
    expect(logRunner.supports('debt' as unknown as BusinessType)).toBe(false);
  });

  it('returns an error result (not a throw) for unsupported business types', async () => {
    const log = makeLog({
      businessType: 'note' as unknown as BusinessType,
      businessId: 'note-1',
    });

    const result = await logRunner.runLogSync(log, dataSource.manager);

    expect(result.syncState).toBe(SyncState.FAILED);
    expect(result.syncError).toContain('不支持的业务类型');
  });

  function itemCreateLog(itemId: string, at = 1000) {
    return makeLog({
      businessType: BusinessType.ITEM,
      businessId: itemId,
      operateData: JSON.stringify({
        id: itemId,
        amount: 10,
        type: 'EXPENSE',
        accountBookId: 'book-1',
        categoryCode: 'c1',
        fundId: 'f1',
        accountDate: '2026-08-01 12:00:00',
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: at,
        updatedAt: at,
      }),
    });
  }

  it('applies an UPDATE log to an existing row without inserting a new one', async () => {
    await logRunner.runLogSync(itemCreateLog('item-1'), dataSource.manager);

    const updateLog = makeLog({
      businessType: BusinessType.ITEM,
      operateType: OperateType.UPDATE,
      businessId: 'item-1',
      operateData: JSON.stringify({
        amount: 99,
        updatedAt: 2000,
        updatedBy: 'u1',
      }),
    });

    const result = await logRunner.runLogSync(updateLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    const items = await itemRepo.find();
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(99);
  });

  it('does not insert a broken row when an UPDATE log has no matching row', async () => {
    const updateLog = makeLog({
      businessType: BusinessType.ITEM,
      operateType: OperateType.UPDATE,
      businessId: 'ghost-item',
      operateData: JSON.stringify({ updatedAt: 2000, updatedBy: 'u1' }),
    });

    const result = await logRunner.runLogSync(updateLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    expect(await itemRepo.count()).toBe(0);
  });

  it('no-ops an UPDATE log with empty businessId instead of inserting', async () => {
    // 客户端部分更新日志可能缺失 businessId（旧版本），必须 no-op 而非插入残缺行
    const updateLog = makeLog({
      businessType: BusinessType.ITEM,
      operateType: OperateType.UPDATE,
      businessId: '',
      operateData: JSON.stringify({ updatedAt: 2000, updatedBy: 'u1' }),
    });

    const result = await logRunner.runLogSync(updateLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    expect(await itemRepo.count()).toBe(0);
  });
});
