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
    AccountNote,
  ];

  let dataSource: DataSource;
  let logRunner: LogRunner;
  let itemRepo: Repository<AccountItem>;
  let shopRepo: Repository<AccountShop>;
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
    shopRepo = dataSource.getRepository(AccountShop);
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
    await shopRepo.clear();
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

  it('replays note create/update/delete into the note table', async () => {
    const createLog = makeLog({
      businessType: BusinessType.NOTE,
      businessId: 'note-1',
      operateData: JSON.stringify({
        id: 'note-1',
        title: '买菜清单',
        content: '土豆西红柿',
        noteType: 'NOTE',
        scope: 'book',
        accountBookId: 'book-1',
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: 1000,
        updatedAt: 1000,
      }),
    });
    const createResult = await logRunner.runLogSync(createLog, dataSource.manager);
    expect(createResult.syncState).toBe(SyncState.SYNCED);

    const noteRepo = dataSource.getRepository(AccountNote);
    const note = await noteRepo.findOneBy({ id: 'note-1' });
    expect(note).not.toBeNull();
    expect(note!.title).toBe('买菜清单');
    expect(note!.noteType).toBe('NOTE');

    // 更新
    const updateLog = makeLog({
      businessType: BusinessType.NOTE,
      operateType: OperateType.UPDATE,
      businessId: 'note-1',
      operateData: JSON.stringify({ title: '更新后的清单', updatedAt: 2000, updatedBy: 'u1' }),
    });
    const updateResult = await logRunner.runLogSync(updateLog, dataSource.manager);
    expect(updateResult.syncState).toBe(SyncState.SYNCED);
    expect((await noteRepo.findOneBy({ id: 'note-1' }))?.title).toBe('更新后的清单');

    // 删除
    const deleteLog = makeLog({
      businessType: BusinessType.NOTE,
      operateType: OperateType.DELETE,
      businessId: 'note-1',
    });
    await logRunner.runLogSync(deleteLog, dataSource.manager);
    expect(await noteRepo.findOneBy({ id: 'note-1' })).toBeNull();
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
    expect(logRunner.supports(BusinessType.NOTE)).toBe(true);
    expect(logRunner.supports('giftCard' as unknown as BusinessType)).toBe(false);
    expect(logRunner.supports('debt' as unknown as BusinessType)).toBe(false);
  });

  it('returns an error result (not a throw) for unsupported business types', async () => {
    const log = makeLog({
      businessType: 'debt' as unknown as BusinessType,
      businessId: 'debt-1',
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

  it('applies a shop UPDATE log carrying an unknown field (lastAccountItemAt) without failing', async () => {
    // 客户端 shop 表有 lastAccountItemAt，但服务端实体没有 → 回放需剥离未知字段
    const createLog = makeLog({
      businessType: BusinessType.SHOP,
      businessId: 'shop-1',
      operateData: JSON.stringify({
        id: 'shop-1',
        name: '老店',
        code: 'S1',
        accountBookId: 'book-1',
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: 1000,
        updatedAt: 1000,
      }),
    });
    await logRunner.runLogSync(createLog, dataSource.manager);

    const updateLog = makeLog({
      businessType: BusinessType.SHOP,
      operateType: OperateType.UPDATE,
      businessId: 'shop-1',
      operateData: JSON.stringify({
        name: '新店',
        lastAccountItemAt: '2026-08-01 12:00:00',
        updatedAt: 2000,
        updatedBy: 'u1',
      }),
    });

    const result = await logRunner.runLogSync(updateLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    const shops = await shopRepo.find();
    expect(shops).toHaveLength(1);
    expect(shops[0].name).toBe('新店');
  });

  it('applies a fund UPDATE log carrying an unknown field without failing', async () => {
    const createLog = makeLog({
      businessType: BusinessType.FUND,
      businessId: 'fund-1',
      operateData: JSON.stringify({
        id: 'fund-1',
        name: '现金',
        fundType: 'CASH',
        accountBookId: 'book-1',
        createdBy: 'u1',
        updatedBy: 'u1',
        createdAt: 1000,
        updatedAt: 1000,
      }),
    });
    await logRunner.runLogSync(createLog, dataSource.manager);

    const updateLog = makeLog({
      businessType: BusinessType.FUND,
      operateType: OperateType.UPDATE,
      businessId: 'fund-1',
      operateData: JSON.stringify({
        fundBalance: 88.5,
        lastAccountItemAt: '2026-08-01 12:00:00',
        updatedAt: 2000,
        updatedBy: 'u1',
      }),
    });

    const result = await logRunner.runLogSync(updateLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    const funds = await dataSource.getRepository(AccountFund).find();
    expect(funds).toHaveLength(1);
    expect(funds[0].fundBalance).toBe(88.5);
  });

  it('applies a BATCH_UPDATE log with the client {ids, data} envelope', async () => {
    // 先建两条 shop
    await logRunner.runLogSync(
      makeLog({
        businessType: BusinessType.SHOP,
        businessId: 'shop-1',
        operateData: JSON.stringify({
          id: 'shop-1',
          name: '店A',
          code: 'S1',
          accountBookId: 'book-1',
          createdBy: 'u1',
          updatedBy: 'u1',
          createdAt: 1000,
          updatedAt: 1000,
        }),
      }),
      dataSource.manager,
    );
    await logRunner.runLogSync(
      makeLog({
        businessType: BusinessType.SHOP,
        businessId: 'shop-2',
        operateData: JSON.stringify({
          id: 'shop-2',
          name: '店B',
          code: 'S2',
          accountBookId: 'book-1',
          createdBy: 'u1',
          updatedBy: 'u1',
          createdAt: 1000,
          updatedAt: 1000,
        }),
      }),
      dataSource.manager,
    );

    // 客户端 batchUpdate：{ids:[...], data:[json串...]}，含实体没有的 parentId/sortOrder
    const batchLog = makeLog({
      businessType: BusinessType.SHOP,
      operateType: OperateType.BATCH_UPDATE,
      businessId: 'shop-1',
      operateData: JSON.stringify({
        ids: ['shop-1', 'shop-2'],
        data: [
          JSON.stringify({
            updatedAt: 2000,
            updatedBy: 'u1',
            parentId: 'book-x',
            sortOrder: 1,
          }),
          JSON.stringify({
            updatedAt: 2000,
            updatedBy: 'u1',
            parentId: 'book-x',
            sortOrder: 2,
          }),
        ],
      }),
    });

    const result = await logRunner.runLogSync(batchLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    const shops = await shopRepo.find();
    expect(shops).toHaveLength(2);
    expect(shops.every((s) => s.updatedAt === 2000)).toBe(true);
  });

  it('applies a BATCH_DELETE log with empty operateData by deleting businessId', async () => {
    await logRunner.runLogSync(
      makeLog({
        businessType: BusinessType.CATEGORY,
        businessId: 'cat-1',
        operateData: JSON.stringify({
          id: 'cat-1',
          name: '餐饮',
          code: 'C1',
          categoryType: 'EXPENSE',
          accountBookId: 'book-1',
          createdBy: 'u1',
          updatedBy: 'u1',
          createdAt: 1000,
          updatedAt: 1000,
        }),
      }),
      dataSource.manager,
    );
    expect(await dataSource.getRepository(AccountCategory).count()).toBe(1);

    // 客户端某些 batchDelete 日志 operateData 为空串，仅带 businessId
    const deleteLog = makeLog({
      businessType: BusinessType.CATEGORY,
      operateType: OperateType.BATCH_DELETE,
      businessId: 'cat-1',
      operateData: '',
    });

    const result = await logRunner.runLogSync(deleteLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    expect(await dataSource.getRepository(AccountCategory).count()).toBe(0);
  });

  it('applies a BATCH_DELETE log with the {ids:[...]} envelope', async () => {
    for (const id of ['cat-1', 'cat-2']) {
      await logRunner.runLogSync(
        makeLog({
          businessType: BusinessType.CATEGORY,
          businessId: id,
          operateData: JSON.stringify({
            id,
            name: `分类${id}`,
            code: `C${id}`,
            categoryType: 'EXPENSE',
            accountBookId: 'book-1',
            createdBy: 'u1',
            updatedBy: 'u1',
            createdAt: 1000,
            updatedAt: 1000,
          }),
        }),
        dataSource.manager,
      );
    }
    expect(await dataSource.getRepository(AccountCategory).count()).toBe(2);

    const deleteLog = makeLog({
      businessType: BusinessType.CATEGORY,
      operateType: OperateType.BATCH_DELETE,
      businessId: 'cat-1',
      operateData: JSON.stringify({ ids: ['cat-1', 'cat-2'] }),
    });

    const result = await logRunner.runLogSync(deleteLog, dataSource.manager);

    expect(result.syncState).toBe(SyncState.SYNCED);
    expect(await dataSource.getRepository(AccountCategory).count()).toBe(0);
  });
});
