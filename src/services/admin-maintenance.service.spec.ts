import { DataSource, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminMaintenanceService } from './admin-maintenance.service';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';

describe('AdminMaintenanceService', () => {
  const ENTITIES = [
    AccountBook,
    AccountItem,
    AccountCategory,
    AccountShop,
    AccountSymbol,
    LogSync,
  ];

  let dataSource: DataSource;
  let service: AdminMaintenanceService;
  let logRepo: Repository<LogSync>;
  let flushMock: jest.Mock;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();
    logRepo = dataSource.getRepository(LogSync);
    flushMock = jest.fn().mockResolvedValue({ processed: 0, failed: 0 });
    service = new AdminMaintenanceService(
      dataSource.getRepository(AccountBook),
      dataSource.getRepository(AccountItem),
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountSymbol),
      logRepo,
      { flush: flushMock } as any,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await logRepo.clear();
    await dataSource.getRepository(AccountBook).clear();
    await dataSource.getRepository(AccountItem).clear();
    await dataSource.getRepository(AccountCategory).clear();
    await dataSource.getRepository(AccountShop).clear();
    await dataSource.getRepository(AccountSymbol).clear();
    flushMock.mockClear();
  });

  async function makeBook(id: string, owner: string) {
    const b = new AccountBook();
    Object.assign(b, {
      id,
      name: `账本${id}`,
      createdBy: owner,
      updatedBy: owner,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountBook).save(b);
  }

  async function makeCategory(id: string, bookId: string, code: string, name: string) {
    const c = new AccountCategory();
    Object.assign(c, {
      id,
      accountBookId: bookId,
      code,
      name,
      categoryType: 'EXPENSE',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountCategory).save(c);
  }

  async function makeItem(id: string, bookId: string, categoryCode: string) {
    const i = new AccountItem();
    Object.assign(i, {
      id,
      accountBookId: bookId,
      amount: 10,
      type: 'EXPENSE',
      categoryCode,
      fundId: 'f1',
      accountDate: '2026-08-01 10:00:00',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountItem).save(i);
  }

  it('listEntities returns entities with item reference counts', async () => {
    await makeBook('b1', 'owner1');
    await makeCategory('c1', 'b1', 'C1', '餐饮');
    await makeCategory('c2', 'b1', 'C2', '交通');
    await makeItem('i1', 'b1', 'C1');
    await makeItem('i2', 'b1', 'C1');

    const list = await service.listEntities('b1', 'category');

    expect(list).toHaveLength(2);
    const c1 = list.find((x) => x.code === 'C1');
    expect(c1?.itemCount).toBe(2);
    const c2 = list.find((x) => x.code === 'C2');
    expect(c2?.itemCount).toBe(0);
  });

  it('rename creates an UPDATE LogSync (log-driven) and flushes', async () => {
    await makeBook('b1', 'owner1');
    await makeCategory('c1', 'b1', 'C1', '旧名');

    const res = await service.rename({ bookId: 'b1', type: 'category', id: 'c1', name: '新名' });

    expect(res.name).toBe('新名');
    expect(flushMock).toHaveBeenCalled();
    const logs = await logRepo.find();
    expect(logs).toHaveLength(1);
    expect(logs[0].businessType).toBe(BusinessType.CATEGORY);
    expect(logs[0].operateType).toBe(OperateType.UPDATE);
    expect(logs[0].parentType).toBe('book');
    expect(logs[0].parentId).toBe('b1');
    expect(logs[0].businessId).toBe('c1');
    expect(logs[0].operatorId).toBe('owner1'); // 操作人=账本创建者
    expect(logs[0].syncState).toBe(SyncState.SYNCED);
    expect(JSON.parse(logs[0].operateData).name).toBe('新名');
  });

  it('delete creates one DELETE log per id and flushes', async () => {
    await makeBook('b1', 'owner1');
    await makeCategory('c1', 'b1', 'C1', '餐饮');
    await makeCategory('c2', 'b1', 'C2', '交通');

    const res = await service.delete({ bookId: 'b1', type: 'category', ids: ['c1', 'c2'] });

    expect(res.deleted.sort()).toEqual(['c1', 'c2']);
    expect(flushMock).toHaveBeenCalled();
    const logs = await logRepo.find();
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.operateType === OperateType.DELETE)).toBe(true);
  });

  it('merge reassigns item references via ITEM batchUpdate log then deletes source', async () => {
    await makeBook('b1', 'owner1');
    await makeCategory('cA', 'b1', 'CA', '旧分类');
    await makeCategory('cB', 'b1', 'CB', '新分类');
    await makeItem('i1', 'b1', 'CA');
    await makeItem('i2', 'b1', 'CA');

    const res = await service.merge({ bookId: 'b1', type: 'category', fromId: 'cA', toId: 'cB' });

    expect(res.reassignedItems).toBe(2);
    expect(flushMock).toHaveBeenCalled();
    const logs = await logRepo.find();
    // ITEM BATCH_UPDATE + CATEGORY DELETE
    expect(logs).toHaveLength(2);
    const itemLog = logs.find((l) => l.businessType === BusinessType.ITEM);
    const deleteLog = logs.find((l) => l.businessType === BusinessType.CATEGORY);
    expect(itemLog?.operateType).toBe(OperateType.BATCH_UPDATE);
    const payload = JSON.parse(itemLog!.operateData);
    expect(payload.ids).toHaveLength(2);
    // 每条 data 重定向到 CB
    for (const d of payload.data) {
      expect(JSON.parse(d).categoryCode).toBe('CB');
    }
    expect(deleteLog?.operateType).toBe(OperateType.DELETE);
    expect(deleteLog?.businessId).toBe('cA');
    // 删除日志晚于重定向日志（保证回放顺序）
    expect(deleteLog!.operatedAt).toBeGreaterThan(itemLog!.operatedAt);
  });

  it('throws NotFound for rename of a missing entity', async () => {
    await makeBook('b1', 'owner1');
    await expect(
      service.rename({ bookId: 'b1', type: 'category', id: 'ghost', name: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequest when merging into itself', async () => {
    await makeBook('b1', 'owner1');
    await makeCategory('c1', 'b1', 'C1', '餐饮');
    await expect(
      service.merge({ bookId: 'b1', type: 'category', fromId: 'c1', toId: 'c1' }),
    ).rejects.toThrow(BadRequestException);
  });
});
