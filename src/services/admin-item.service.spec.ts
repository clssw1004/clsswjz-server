import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminItemService } from './admin-item.service';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { User } from '../pojo/entities/user.entity';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';

describe('AdminItemService', () => {
  const ENTITIES = [
    AccountItem,
    AccountCategory,
    AccountShop,
    AccountFund,
    AccountBook,
    LogSync,
    User,
  ];

  let dataSource: DataSource;
  let service: AdminItemService;
  let itemRepo: Repository<AccountItem>;
  let logRepo: Repository<LogSync>;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();
    itemRepo = dataSource.getRepository(AccountItem);
    logRepo = dataSource.getRepository(LogSync);
    service = new AdminItemService(
      itemRepo,
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountFund),
      logRepo,
      dataSource.getRepository(User),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await itemRepo.clear();
    await logRepo.clear();
    await dataSource.getRepository(AccountCategory).clear();
    await dataSource.getRepository(AccountShop).clear();
    await dataSource.getRepository(AccountFund).clear();
    await dataSource.getRepository(AccountBook).clear();
  });

  async function makeItem(id: string, bookId: string, at: string) {
    const item = new AccountItem();
    Object.assign(item, {
      id,
      accountBookId: bookId,
      amount: 10,
      type: 'EXPENSE',
      categoryCode: 'c1',
      shopCode: 'S1',
      fundId: 'f1',
      accountDate: at,
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await itemRepo.save(item);
  }

  async function makeCategory(code: string, name: string) {
    const cat = new AccountCategory();
    Object.assign(cat, {
      id: `cat-${code}`,
      code,
      name,
      categoryType: 'EXPENSE',
      accountBookId: 'b1',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountCategory).save(cat);
  }

  async function makeShop(code: string, name: string) {
    const shop = new AccountShop();
    Object.assign(shop, {
      id: `shop-${code}`,
      code,
      name,
      accountBookId: 'b1',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountShop).save(shop);
  }

  async function makeFund(id: string, name: string) {
    const fund = new AccountFund();
    Object.assign(fund, {
      id,
      name,
      fundType: 'CASH',
      accountBookId: 'b1',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountFund).save(fund);
  }

  function makeLog(itemId: string, operateType: OperateType, at: number) {
    return logRepo.save(
      logRepo.create({
        id: `log-${itemId}-${operateType}-${at}`,
        businessType: BusinessType.ITEM,
        operateType,
        parentType: 'book',
        parentId: 'b1',
        operatorId: 'u1',
        operatedAt: at,
        businessId: itemId,
        operateData:
          operateType === OperateType.UPDATE
            ? JSON.stringify({ amount: 99, updatedAt: at, updatedBy: 'u1' })
            : '{}',
        syncState: SyncState.SYNCED,
        syncTime: at,
      }),
    );
  }

  it('listItems returns paginated items for a book with resolved names', async () => {
    await makeCategory('c1', '餐饮');
    await makeShop('S1', '沃尔玛');
    await makeFund('f1', '现金');
    await makeItem('i1', 'b1', '2026-08-01 12:00:00');
    await makeItem('i2', 'b1', '2026-08-02 12:00:00');
    await makeItem('i3', 'b2', '2026-08-03 12:00:00'); // 其它账本

    const { items, total } = await service.listItems('b1', {
      page: 1,
      pageSize: 1,
    });

    expect(total).toBe(2);
    expect(items).toHaveLength(1);
    expect(items[0].categoryName).toBe('餐饮');
    expect(items[0].shopName).toBe('沃尔玛');
    expect(items[0].fundName).toBe('现金');
  });

  it('getItemDetail returns item detail and its logs ordered by time', async () => {
    await makeCategory('c1', '餐饮');
    await makeItem('i1', 'b1', '2026-08-01 12:00:00');
    await makeLog('i1', OperateType.CREATE, 1000);
    await makeLog('i1', OperateType.UPDATE, 2000);
    // 一条引用分类编码的更新日志
    await logRepo.save(
      logRepo.create({
        id: 'log-i1-update-cat',
        businessType: BusinessType.ITEM,
        operateType: OperateType.UPDATE,
        parentType: 'book',
        parentId: 'b1',
        operatorId: 'u1',
        operatedAt: 3000,
        businessId: 'i1',
        operateData: JSON.stringify({
          categoryCode: 'c1',
          updatedAt: 3000,
          updatedBy: 'u1',
        }),
        syncState: SyncState.SYNCED,
        syncTime: 3000,
      }),
    );

    const detail = await service.getItemDetail('i1');

    expect(detail.item.id).toBe('i1');
    expect(detail.item.categoryName).toBe('餐饮');
    expect(detail.logs).toHaveLength(3);
    expect(detail.logs.map((l) => l.operatedAt)).toEqual([1000, 2000, 3000]);
    expect(detail.logs[1].operateData.amount).toBe(99);
    // 名称映射：日志中的分类编码 → 名称
    expect(detail.nameMap.categories['c1']).toBe('餐饮');
  });

  it('getItemDetail throws NotFound for a missing item', async () => {
    await expect(service.getItemDetail('ghost')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('listItems supports type/category/fund/shop/month filters', async () => {
    await makeCategory('c1', '餐饮');
    await makeShop('S1', '沃尔玛');
    await makeFund('f1', '现金');
    // 支出-餐饮-现金-8月
    const i1 = new AccountItem();
    Object.assign(i1, { id: 'i1', accountBookId: 'b1', amount: -10, type: 'EXPENSE', categoryCode: 'c1', shopCode: 'S1', fundId: 'f1', accountDate: '2026-08-01 10:00:00', createdBy: 'u1', updatedBy: 'u1', createdAt: 1000, updatedAt: 1000 });
    await itemRepo.save(i1);
    // 收入-餐饮-现金-9月
    const i2 = new AccountItem();
    Object.assign(i2, { id: 'i2', accountBookId: 'b1', amount: 20, type: 'INCOME', categoryCode: 'c1', shopCode: 'S1', fundId: 'f1', accountDate: '2026-09-01 10:00:00', createdBy: 'u1', updatedBy: 'u1', createdAt: 1000, updatedAt: 1000 });
    await itemRepo.save(i2);
    // 支出-无商户-现金-8月
    const i3 = new AccountItem();
    Object.assign(i3, { id: 'i3', accountBookId: 'b1', amount: -5, type: 'EXPENSE', categoryCode: 'c1', fundId: 'f1', accountDate: '2026-08-05 10:00:00', createdBy: 'u1', updatedBy: 'u1', createdAt: 1000, updatedAt: 1000 });
    await itemRepo.save(i3);

    const byType = await service.listItems('b1', { page: 1, pageSize: 10, type: 'INCOME' });
    expect(byType.total).toBe(1);
    expect(byType.items[0].id).toBe('i2');

    const byCat = await service.listItems('b1', { page: 1, pageSize: 10, categoryCodes: 'c1' });
    expect(byCat.total).toBe(3);

    const byShop = await service.listItems('b1', { page: 1, pageSize: 10, shopCodes: 'S1' });
    expect(byShop.total).toBe(2);

    const byMonth = await service.listItems('b1', { page: 1, pageSize: 10, month: '2026-08' });
    expect(byMonth.total).toBe(2);
  });

  it('listItems supports amount and date sorting', async () => {
    await makeItem('i1', 'b1', '2026-08-01 12:00:00');
    await makeItem('i2', 'b1', '2026-08-02 12:00:00');
    await makeItem('i3', 'b1', '2026-08-03 12:00:00');
    await itemRepo.update({ id: 'i1' }, { amount: -5 });
    await itemRepo.update({ id: 'i2' }, { amount: -50 });
    await itemRepo.update({ id: 'i3' }, { amount: -20 });

    const amountAsc = await service.listItems('b1', {
      page: 1,
      pageSize: 10,
      sortBy: 'amount',
      sortOrder: 'ASC',
    });
    // 金额升序：-50 < -20 < -5
    expect(amountAsc.items.map((i) => i.id)).toEqual(['i2', 'i3', 'i1']);

    const dateAsc = await service.listItems('b1', {
      page: 1,
      pageSize: 10,
      sortBy: 'accountDate',
      sortOrder: 'ASC',
    });
    expect(dateAsc.items[0].id).toBe('i1');

    const dateDesc = await service.listItems('b1', {
      page: 1,
      pageSize: 10,
      sortBy: 'accountDate',
      sortOrder: 'DESC',
    });
    expect(dateDesc.items[0].id).toBe('i3');
  });
});
