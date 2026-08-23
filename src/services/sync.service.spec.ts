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
import { SyncPullDto } from '../pojo/dto/log-sync/sync.dto';

describe('SyncService', () => {
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
  let materializeService: MaterializeService;
  let logSyncRepo: Repository<LogSync>;
  let accountBookRepo: Repository<AccountBook>;
  let relRepo: Repository<AccountBookUser>;

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
    accountBookRepo = dataSource.getRepository(AccountBook);
    relRepo = dataSource.getRepository(AccountBookUser);
    const logRunner = new LogRunner(
      accountBookRepo,
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountItem),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountSymbol),
      dataSource.getRepository(AccountFund),
      relRepo,
      dataSource.getRepository(User),
      dataSource.getRepository(AttachmentEntity),
    );
    materializeService = new MaterializeService(logSyncRepo, logRunner);
    service = new SyncService(
      logSyncRepo,
      logRunner,
      materializeService,
      {} as any, // userService
      {} as any, // tokenService
      cacheMock as any,
      accountBookRepo,
      relRepo,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await logSyncRepo.clear();
    await accountBookRepo.clear();
    await relRepo.clear();
    cacheMock.set.mockClear();
    cacheMock.get.mockReset();
  });

  function buildLog(overrides: Partial<LogSync> = {}): LogSync {
    return {
      id: `log-${Date.now()}-${Math.random()}`,
      businessType: BusinessType.BOOK,
      operateType: OperateType.CREATE,
      parentType: 'book',
      parentId: 'book-x',
      operatorId: 'u1',
      operatedAt: 1000,
      businessId: 'book-x',
      operateData: '{}',
      syncState: SyncState.UNSYNCED,
      syncTime: 1000,
      ...overrides,
    } as LogSync;
  }

  async function insertSynced(overrides: Partial<LogSync> = {}): Promise<void> {
    await logSyncRepo.save(
      buildLog({ ...overrides, syncState: SyncState.SYNCED }),
    );
  }

  function bookCreate(
    bookId: string,
    operatorId: string,
    at = 1000,
  ): Partial<LogSync> {
    return {
      id: `log-${bookId}-create`,
      businessType: BusinessType.BOOK,
      operateType: OperateType.CREATE,
      parentType: 'book',
      parentId: bookId,
      operatorId,
      operatedAt: at,
      businessId: bookId,
      operateData: JSON.stringify({
        id: bookId,
        name: `账本${bookId}`,
        createdBy: operatorId,
        updatedBy: operatorId,
        createdAt: at,
        updatedAt: at,
      }),
    };
  }

  function itemCreate(
    itemId: string,
    bookId: string,
    operatorId: string,
    at = 2000,
  ): Partial<LogSync> {
    return {
      id: `log-${itemId}-create`,
      businessType: BusinessType.ITEM,
      operateType: OperateType.CREATE,
      parentType: 'book',
      parentId: bookId,
      operatorId,
      operatedAt: at,
      businessId: itemId,
      operateData: JSON.stringify({
        id: itemId,
        amount: 50,
        type: 'EXPENSE',
        accountBookId: bookId,
        categoryCode: 'c1',
        accountDate: '2026-08-12 12:00:00',
        createdBy: operatorId,
        updatedBy: operatorId,
        createdAt: at,
        updatedAt: at,
      }),
    };
  }

  function bookMemberCreate(
    relId: string,
    bookId: string,
    inviterId: string,
    memberId: string,
    at = 3000,
  ): Partial<LogSync> {
    return {
      id: `log-${relId}-create`,
      businessType: BusinessType.BOOK_MEMBER,
      operateType: OperateType.CREATE,
      parentType: 'book',
      parentId: bookId,
      operatorId: inviterId,
      operatedAt: at,
      businessId: relId,
      operateData: JSON.stringify({
        id: relId,
        userId: memberId,
        accountBookId: bookId,
        canViewBook: true,
        canViewItem: true,
        createdAt: at,
        updatedAt: at,
      }),
    };
  }

  function bookMemberDelete(
    relId: string,
    bookId: string,
    removerId: string,
    memberId: string,
    at = 4000,
  ): Partial<LogSync> {
    return {
      id: `log-${relId}-delete`,
      businessType: BusinessType.BOOK_MEMBER,
      operateType: OperateType.DELETE,
      parentType: 'book',
      parentId: bookId,
      operatorId: removerId,
      operatedAt: at,
      businessId: relId,
      operateData: JSON.stringify({
        userId: memberId,
        accountBookId: bookId,
      }),
    };
  }

  function userCreate(
    userId: string,
    at = 500,
    overrides: Record<string, any> = {},
  ): Partial<LogSync> {
    return {
      id: `log-${userId}-user`,
      businessType: BusinessType.USER,
      operateType: OperateType.CREATE,
      parentType: 'root',
      parentId: 'None',
      operatorId: userId,
      operatedAt: at,
      businessId: userId,
      operateData: JSON.stringify({
        id: userId,
        username: `user_${userId}`,
        password: 'hashed-pwd',
        nickname: `昵称${userId}`,
        phone: '13800000000',
        email: `${userId}@example.com`,
        avatar: 'avatar-1',
        createdAt: at,
        updatedAt: at,
        ...overrides,
      }),
    };
  }

  function pullDto(overrides: Partial<SyncPullDto> = {}): SyncPullDto {
    return {
      syncTimeStamp: 0,
      page: 1,
      pageSize: 100,
      ...overrides,
    };
  }

  describe('push', () => {
    it('accepts and saves a log whose operatorId matches the authenticated user', async () => {
      const result = await service.push([buildLog()], 'u1');
      // 等待 push 触发的后台回放完成，避免浮动 Promise 干扰后续测试
      await materializeService.flush();

      expect(result.results[0].syncState).toBe(SyncState.SYNCED);
      const saved = await logSyncRepo.findOneBy({
        id: result.results[0].logId,
      });
      expect(saved).not.toBeNull();
    });

    it('rejects (without saving) a log whose operatorId does not match the authenticated user', async () => {
      const result = await service.push([buildLog({ operatorId: 'u2' })], 'u1');

      expect(result.results[0].syncState).toBe(SyncState.FAILED);
      expect(result.results[0].syncError).toContain('operatorId');
      expect(await logSyncRepo.count()).toBe(0);
    });

    it('is idempotent: re-pushing an already-existing log returns success without re-saving', async () => {
      const log = buildLog();
      await logSyncRepo.save({ ...log, syncState: SyncState.SYNCED });

      const result = await service.push([log], 'u1');

      expect(result.results[0].syncState).toBe(SyncState.SYNCED);
      expect(await logSyncRepo.count()).toBe(1);
      expect(cacheMock.set).not.toHaveBeenCalled();
    });

    it('rejects a book-scoped log when the operator is not a member of that book', async () => {
      // u2 创建账本 b2 并已落库；u1 与之无关
      await insertSynced(bookCreate('b2', 'u2'));
      await materializeService.flush();

      const log = buildLog({
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentId: 'b2',
        businessId: 'item-x',
      });
      const result = await service.push([log], 'u1');

      expect(result.results[0].syncState).toBe(SyncState.FAILED);
      expect(result.results[0].syncError).toContain('无权');
      // 被拒的日志未落库（b2 的创建日志仍在，但 item-x 不应出现）
      const pushed = await logSyncRepo.findOneBy({ id: log.id });
      expect(pushed).toBeNull();
    });

    it('allows a book create log for a new book (self-referential parent)', async () => {
      const result = await service.push([buildLog()], 'u1');
      await materializeService.flush();

      expect(result.results[0].syncState).toBe(SyncState.SYNCED);
    });

    it('allows pushing to a book the user created', async () => {
      await service.push(
        [buildLog({ id: 'log-b1', parentId: 'b1', businessId: 'b1' })],
        'u1',
      );
      await materializeService.flush();

      const log = buildLog({
        id: 'log-item-b1',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentId: 'b1',
        businessId: 'item-1',
      });
      const result = await service.push([log], 'u1');
      await materializeService.flush();

      expect(result.results[0].syncState).toBe(SyncState.SYNCED);
    });
  });

  describe('pull isolation', () => {
    it("returns only the caller's own logs and logs of books they belong to", async () => {
      // u1 创建账本 b1 + 一笔支出；u2 创建账本 b2 + 一笔支出（与 u1 无关）
      await insertSynced(bookCreate('b1', 'u1'));
      await insertSynced(itemCreate('item1', 'b1', 'u1'));
      await insertSynced(bookCreate('b2', 'u2'));
      await insertSynced(itemCreate('item2', 'b2', 'u2'));

      const { changes } = await service.pull(pullDto(), 'u1');

      const itemIds = changes
        .filter((c) => c.businessType === BusinessType.ITEM)
        .map((c) => c.businessId);
      expect(itemIds).toContain('item1');
      expect(itemIds).not.toContain('item2');
    });

    it("lets a shared-book member see the inviter's book data", async () => {
      await insertSynced(bookCreate('b1', 'u1'));
      await insertSynced(itemCreate('item1', 'b1', 'u1'));
      await insertSynced(bookCreate('b2', 'u2'));
      await insertSynced(itemCreate('item2', 'b2', 'u2'));
      // u1 邀请 u2 加入 b1
      await insertSynced(bookMemberCreate('rel-u2-b1', 'b1', 'u1', 'u2'));

      const { changes } = await service.pull(pullDto(), 'u2');

      const itemIds = changes
        .filter((c) => c.businessType === BusinessType.ITEM)
        .map((c) => c.businessId);
      expect(itemIds).toContain('item2'); // 自己的账本
      expect(itemIds).toContain('item1'); // 共享账本 b1 的数据
    });

    it("delivers a removed member's own bookMember delete log but no longer their book data", async () => {
      await insertSynced(bookCreate('b1', 'u1'));
      await insertSynced(itemCreate('item1', 'b1', 'u1'));
      // u1 邀请 u3，再移除 u3
      await insertSynced(bookMemberCreate('rel-u3-b1', 'b1', 'u1', 'u3', 3000));
      await insertSynced(bookMemberDelete('rel-u3-b1', 'b1', 'u1', 'u3', 4000));

      const { changes } = await service.pull(pullDto(), 'u3');

      // 能看到"自己被移除"的 bookMember delete 日志（about-me 规则）
      const memberEvents = changes.filter(
        (c) => c.businessType === BusinessType.BOOK_MEMBER,
      );
      expect(
        memberEvents.some((c) => c.operateType === OperateType.DELETE),
      ).toBe(true);
      // 但看不到账本 b1 的业务数据（已不是成员，operator 也不是 u3）
      const itemIds = changes
        .filter((c) => c.businessType === BusinessType.ITEM)
        .map((c) => c.businessId);
      expect(itemIds).not.toContain('item1');
      expect(
        changes.some(
          (c) => c.businessType === BusinessType.BOOK && c.businessId === 'b1',
        ),
      ).toBe(false);
    });

    it('honors the businessTypes filter on top of isolation', async () => {
      await insertSynced(bookCreate('b1', 'u1'));
      await insertSynced(itemCreate('item1', 'b1', 'u1'));

      const { changes } = await service.pull(
        pullDto({ businessTypes: ['item'] }),
        'u1',
      );

      expect(changes.length).toBe(1);
      expect(changes[0].businessType).toBe(BusinessType.ITEM);
    });

    it("lets book members pull each other's USER profile logs (userId → nickname translation)", async () => {
      // u1 创建账本 b1 并邀请 u2；u2 有自己的 user 资料日志
      await insertSynced(bookCreate('b1', 'u1'));
      await insertSynced(bookMemberCreate('rel-u2-b1', 'b1', 'u1', 'u2'));
      await insertSynced(userCreate('u2'));

      // u1 拉取：能看到成员 u2 的 user 日志
      const { changes: changesU1 } = await service.pull(pullDto(), 'u1');
      const userLogsU1 = changesU1.filter(
        (c) => c.businessType === BusinessType.USER,
      );
      expect(userLogsU1.map((c) => c.businessId)).toContain('u2');

      // u2 拉取：也能看到创建者 u1 的 user 日志
      await insertSynced(userCreate('u1'));
      const { changes: changesU2 } = await service.pull(pullDto(), 'u2');
      const userLogsU2 = changesU2.filter(
        (c) => c.businessType === BusinessType.USER,
      );
      expect(userLogsU2.map((c) => c.businessId)).toContain('u1');
    });

    it('does not leak USER logs of users outside any shared book', async () => {
      // u1 创建 b1；u3 与 u1 无任何账本关系
      await insertSynced(bookCreate('b1', 'u1'));
      await insertSynced(userCreate('u3'));

      const { changes } = await service.pull(pullDto(), 'u1');

      expect(
        changes.some(
          (c) => c.businessType === BusinessType.USER && c.businessId === 'u3',
        ),
      ).toBe(false);
    });

    it('desensitizes other members USER logs (username/password/phone/email)', async () => {
      await insertSynced(bookCreate('b1', 'u1'));
      await insertSynced(bookMemberCreate('rel-u2-b1', 'b1', 'u1', 'u2'));
      await insertSynced(userCreate('u2'));

      const { changes } = await service.pull(pullDto(), 'u1');
      const u2Log = changes.find(
        (c) => c.businessType === BusinessType.USER && c.businessId === 'u2',
      );
      expect(u2Log).toBeDefined();
      const data = JSON.parse(u2Log.operateData);
      expect(data.username).toBe('<secret>');
      expect(data.password).toBe('<secret>');
      expect(data.phone).toBe('<secret>');
      expect(data.email).toBe('<secret>');
      // 昵称/头像等展示字段保留，供 userId → 用户名翻译
      expect(data.nickname).toBe('昵称u2');
      expect(data.avatar).toBe('avatar-1');
    });
  });
});
