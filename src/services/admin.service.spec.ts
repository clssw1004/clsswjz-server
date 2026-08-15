import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from '../pojo/entities/user.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';

describe('AdminService', () => {
  const ENTITIES = [
    User,
    LogSync,
    AccountBook,
    AccountBookUser,
    AccountItem,
    AccountCategory,
    AccountShop,
    AccountFund,
  ];

  let dataSource: DataSource;
  let service: AdminService;
  let jwtService: JwtService;
  let userRepo: Repository<User>;
  let logSyncRepo: Repository<LogSync>;

  const configMock = {
    get: (key: string, def?: any) => {
      const map: Record<string, any> = {
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'secret',
        JWT_SECRET: 'test-secret',
        ADMIN_JWT_EXPIRES_IN: '1h',
      };
      return key in map ? map[key] : def;
    },
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();
    userRepo = dataSource.getRepository(User);
    logSyncRepo = dataSource.getRepository(LogSync);
    jwtService = new JwtService({ secret: 'test-secret' });
    service = new AdminService(
      configMock as any,
      jwtService,
      userRepo,
      logSyncRepo,
      dataSource.getRepository(AccountBook),
      dataSource.getRepository(AccountBookUser),
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountFund),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await userRepo.clear();
    await logSyncRepo.clear();
    await dataSource.getRepository(AccountBook).clear();
    await dataSource.getRepository(AccountBookUser).clear();
    await dataSource.getRepository(AccountItem).clear();
  });

  async function makeUser(username: string) {
    return userRepo.save(
      userRepo.create({
        id: `user-${username}`,
        username,
        nickname: username,
        password: 'x',
      }),
    );
  }

  it('login with correct admin credentials returns an admin token', async () => {
    const result = await service.login('admin', 'secret');

    expect(result.access_token).toBeTruthy();
    const payload = jwtService.verify(result.access_token);
    expect(payload.role).toBe('admin');
  });

  it('login with wrong password throws UnauthorizedException', async () => {
    await expect(service.login('admin', 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('overview returns user and log counts and sync-state distribution', async () => {
    await makeUser('alice');
    await makeUser('bob');

    const now = Date.now();
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-1',
        businessType: BusinessType.BOOK,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: 'u1',
        operatedAt: now,
        businessId: 'b1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: now,
      }),
    );
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-2',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: 'u2',
        operatedAt: now,
        businessId: 'i1',
        operateData: '{}',
        syncState: SyncState.FAILED,
        syncTime: now,
      }),
    );

    const overview = await service.overview();

    expect(overview.totalUsers).toBe(2);
    expect(overview.totalLogs).toBe(2);
    expect(overview.syncStateDistribution[SyncState.SYNCED]).toBe(1);
    expect(overview.syncStateDistribution[SyncState.FAILED]).toBe(1);
    expect(overview.activeUsers7d).toBe(2);
  });

  it('listUsers returns users with their log counts', async () => {
    const alice = await makeUser('alice');
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-3',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: alice.id,
        operatedAt: Date.now(),
        businessId: 'i1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: Date.now(),
      }),
    );

    const { items } = await service.listUsers({ page: 1, pageSize: 10 });

    expect(items.length).toBe(1);
    expect(items[0].username).toBe('alice');
    expect(items[0].logCount).toBe(1);
    expect(items[0].password).toBeUndefined();
  });

  it('listLogs filters by operatorId and returns only matching logs', async () => {
    const alice = await makeUser('alice');
    await makeUser('bob');
    const t = Date.now();
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-a1',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: alice.id,
        operatedAt: t,
        businessId: 'i1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: t,
      }),
    );
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-b1',
        businessType: BusinessType.BOOK,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b2',
        operatorId: 'user-bob',
        operatedAt: t,
        businessId: 'b2',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: t,
      }),
    );

    const { items, total } = await service.listLogs({
      page: 1,
      pageSize: 10,
      operatorId: alice.id,
    });

    expect(total).toBe(1);
    expect(items[0].id).toBe('log-a1');
  });

  it('listLogs resolves operatorName and parentBookName for display', async () => {
    const alice = await makeUser('alice');
    await dataSource.getRepository(AccountBook).save(
      dataSource.getRepository(AccountBook).create({
        id: 'b1',
        name: '家庭账本',
        createdBy: alice.id,
        updatedBy: alice.id,
        createdAt: 1000,
        updatedAt: 1000,
      }),
    );
    const t = Date.now();
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-n1',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: alice.id,
        operatedAt: t,
        businessId: 'i1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: t,
      }),
    );

    const { items } = await service.listLogs({ page: 1, pageSize: 10 });

    expect(items[0].operatorName).toBe('alice');
    expect(items[0].parentBookName).toBe('家庭账本');
  });

  it("listUserLogs returns a specific user's logs", async () => {
    const alice = await makeUser('alice');
    const t = Date.now();
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-a2',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: alice.id,
        operatedAt: t,
        businessId: 'i2',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: t,
      }),
    );

    const { items } = await service.listUserLogs(alice.id, {
      page: 1,
      pageSize: 10,
    });

    expect(items.length).toBe(1);
    expect(items[0].businessId).toBe('i2');
  });

  it('getLogDetail returns the log with parsed operateData', async () => {
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-detail',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: 'u1',
        operatedAt: Date.now(),
        businessId: 'i1',
        operateData: JSON.stringify({ id: 'i1', amount: 50 }),
        syncState: SyncState.SYNCED,
        syncTime: Date.now(),
      }),
    );

    const detail = await service.getLogDetail('log-detail');

    expect(detail.operateData).toEqual({ id: 'i1', amount: 50 });
  });

  it('getUserDetail returns user stats without sensitive fields', async () => {
    const alice = await makeUser('alice');
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'log-a3',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: alice.id,
        operatedAt: Date.now(),
        businessId: 'i1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: Date.now(),
      }),
    );

    const detail = await service.getUserDetail(alice.id);

    expect(detail.user.username).toBe('alice');
    expect(detail.stats.logCount).toBe(1);
    expect(detail.user).not.toHaveProperty('password');
  });

  it('materializeStatus reports materialized/pending/failed counts and recent errors', async () => {
    const now = Date.now();
    // 已回放
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'mat-1',
        businessType: BusinessType.BOOK,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: 'u1',
        operatedAt: 1000,
        businessId: 'b1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: now,
        materializedAt: now,
      }),
    );
    // 待回放
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'pend-1',
        businessType: BusinessType.BOOK,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b2',
        operatorId: 'u1',
        operatedAt: 2000,
        businessId: 'b2',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: now,
      }),
    );
    // 回放失败
    await logSyncRepo.save(
      logSyncRepo.create({
        id: 'fail-1',
        businessType: BusinessType.ITEM,
        operateType: OperateType.CREATE,
        parentType: 'book',
        parentId: 'b3',
        operatorId: 'u1',
        operatedAt: 3000,
        businessId: 'i1',
        operateData: '{}',
        syncState: SyncState.SYNCED,
        syncTime: now,
        materializeError: '回放失败: boom',
      }),
    );

    const status = await service.materializeStatus();

    expect(status.total).toBe(3);
    expect(status.materialized).toBe(1);
    expect(status.pending).toBe(1);
    expect(status.failed).toBe(1);
    expect(status.recentErrors).toHaveLength(1);
    expect(status.recentErrors[0].id).toBe('fail-1');
    expect(status.recentErrors[0].error).toContain('boom');
  });
});
