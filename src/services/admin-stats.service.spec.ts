import { DataSource, Repository } from 'typeorm';
import { AdminStatsService } from './admin-stats.service';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { User } from '../pojo/entities/user.entity';

describe('AdminStatsService', () => {
  let dataSource: DataSource;
  let service: AdminStatsService;
  let itemRepo: Repository<AccountItem>;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        AccountBook,
        AccountItem,
        AccountCategory,
        AccountShop,
        AccountFund,
        AccountBookUser,
        User,
      ],
      synchronize: true,
    });
    await dataSource.initialize();
    itemRepo = dataSource.getRepository(AccountItem);
    service = new AdminStatsService(
      dataSource.getRepository(AccountBook),
      itemRepo,
      dataSource.getRepository(AccountCategory),
      dataSource.getRepository(AccountShop),
      dataSource.getRepository(AccountFund),
      dataSource.getRepository(AccountBookUser),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.getRepository(AccountBook).clear();
    await itemRepo.clear();
    await dataSource.getRepository(AccountCategory).clear();
    await dataSource.getRepository(AccountShop).clear();
    await dataSource.getRepository(AccountFund).clear();
    await dataSource.getRepository(AccountBookUser).clear();
  });

  async function makeBook(id: string, createdBy: string) {
    const book = new AccountBook();
    Object.assign(book, {
      id,
      name: `账本${id}`,
      createdBy,
      updatedBy: createdBy,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountBook).save(book);
  }

  async function makeItem(opts: {
    id: string;
    bookId: string;
    amount: number;
    type: 'EXPENSE' | 'INCOME';
    categoryCode: string;
    accountDate: string;
    createdBy: string;
  }) {
    const item = new AccountItem();
    Object.assign(item, {
      id: opts.id,
      amount: opts.amount,
      type: opts.type,
      accountBookId: opts.bookId,
      categoryCode: opts.categoryCode,
      fundId: 'f1',
      accountDate: opts.accountDate,
      createdBy: opts.createdBy,
      updatedBy: opts.createdBy,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await itemRepo.save(item);
  }

  async function makeCategory(
    code: string,
    name: string,
    categoryType: string,
  ) {
    const cat = new AccountCategory();
    Object.assign(cat, {
      id: `cat-${code}`,
      code,
      name,
      categoryType,
      accountBookId: 'b1',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountCategory).save(cat);
  }

  it('overview aggregates books, items, expense/income sums and categories', async () => {
    await makeBook('b1', 'u1');
    await makeBook('b2', 'u2');
    await makeItem({
      id: 'i1',
      bookId: 'b1',
      amount: 50,
      type: 'EXPENSE',
      categoryCode: 'c1',
      accountDate: '2026-08-01 10:00:00',
      createdBy: 'u1',
    });
    await makeItem({
      id: 'i2',
      bookId: 'b1',
      amount: 30,
      type: 'EXPENSE',
      categoryCode: 'c2',
      accountDate: '2026-08-02 10:00:00',
      createdBy: 'u1',
    });
    await makeItem({
      id: 'i3',
      bookId: 'b2',
      amount: 100,
      type: 'INCOME',
      categoryCode: 'c1',
      accountDate: '2026-08-03 10:00:00',
      createdBy: 'u2',
    });
    await makeCategory('c1', '餐饮', 'EXPENSE');
    await makeCategory('c2', '交通', 'EXPENSE');

    const overview = await service.overview();

    expect(overview.bookCount).toBe(2);
    expect(overview.itemCount).toBe(3);
    expect(overview.expenseTotal).toBe(80);
    expect(overview.incomeTotal).toBe(100);
    expect(overview.balance).toBe(20);
    expect(overview.categoryCount).toBe(2);
    expect(overview.activeUserCount).toBe(2);
  });

  it('trend groups items by day with expense/income series', async () => {
    await makeBook('b1', 'u1');
    await makeItem({
      id: 'i1',
      bookId: 'b1',
      amount: 50,
      type: 'EXPENSE',
      categoryCode: 'c1',
      accountDate: '2026-08-01 10:00:00',
      createdBy: 'u1',
    });
    await makeItem({
      id: 'i2',
      bookId: 'b1',
      amount: 20,
      type: 'EXPENSE',
      categoryCode: 'c1',
      accountDate: '2026-08-01 20:00:00',
      createdBy: 'u1',
    });
    await makeItem({
      id: 'i3',
      bookId: 'b1',
      amount: 100,
      type: 'INCOME',
      categoryCode: 'c1',
      accountDate: '2026-08-02 10:00:00',
      createdBy: 'u1',
    });

    const series = await service.trend({
      granularity: 'day',
      from: '2026-08-01',
      to: '2026-08-02',
    });

    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({
      period: '2026-08-01',
      expense: 70,
      income: 0,
    });
    expect(series[1]).toMatchObject({
      period: '2026-08-02',
      expense: 0,
      income: 100,
    });
  });

  it('categories breakdown groups expense by category name', async () => {
    await makeBook('b1', 'u1');
    await makeItem({
      id: 'i1',
      bookId: 'b1',
      amount: 50,
      type: 'EXPENSE',
      categoryCode: 'c1',
      accountDate: '2026-08-01 10:00:00',
      createdBy: 'u1',
    });
    await makeItem({
      id: 'i2',
      bookId: 'b1',
      amount: 30,
      type: 'EXPENSE',
      categoryCode: 'c2',
      accountDate: '2026-08-02 10:00:00',
      createdBy: 'u1',
    });
    await makeItem({
      id: 'i3',
      bookId: 'b1',
      amount: 20,
      type: 'INCOME',
      categoryCode: 'c1',
      accountDate: '2026-08-03 10:00:00',
      createdBy: 'u1',
    });
    await makeCategory('c1', '餐饮', 'EXPENSE');
    await makeCategory('c2', '交通', 'EXPENSE');

    const breakdown = await service.categories('EXPENSE');

    expect(breakdown).toEqual([
      { categoryCode: 'c1', categoryName: '餐饮', amount: 50 },
      { categoryCode: 'c2', categoryName: '交通', amount: 30 },
    ]);
  });

  it('userBooks returns created and member books; userItems scopes to those books', async () => {
    await makeBook('b1', 'u1');
    await makeBook('b2', 'u2');
    const rel = new AccountBookUser();
    Object.assign(rel, {
      id: 'rel-b2-u1',
      userId: 'u1',
      accountBookId: 'b2',
      canViewBook: true,
      canViewItem: true,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountBookUser).save(rel);
    await makeItem({
      id: 'i1',
      bookId: 'b1',
      amount: 50,
      type: 'EXPENSE',
      categoryCode: 'c1',
      accountDate: '2026-08-01 10:00:00',
      createdBy: 'u1',
    });
    await makeItem({
      id: 'i2',
      bookId: 'b2',
      amount: 99,
      type: 'EXPENSE',
      categoryCode: 'c1',
      accountDate: '2026-08-02 10:00:00',
      createdBy: 'u2',
    });

    const books = await service.userBooks('u1');
    expect(books.map((b) => b.id).sort()).toEqual(['b1', 'b2']);

    const { items } = await service.userItems('u1', { page: 1, pageSize: 10 });
    expect(items.map((i) => i.id)).toContain('i1');
    expect(items.map((i) => i.id)).toContain('i2');
  });

  it('userItems enriches category/shop/fund names for display', async () => {
    await makeBook('b1', 'u1');
    await makeCategory('c1', '餐饮', 'EXPENSE');
    const shop = new AccountShop();
    Object.assign(shop, {
      id: 'shop-1',
      name: '沃尔玛',
      code: 'S1',
      accountBookId: 'b1',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountShop).save(shop);
    const fund = new AccountFund();
    Object.assign(fund, {
      id: 'f1',
      name: '现金',
      fundType: 'CASH',
      accountBookId: 'b1',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountFund).save(fund);
    await makeItem({
      id: 'i1',
      bookId: 'b1',
      amount: 50,
      type: 'EXPENSE',
      categoryCode: 'c1',
      accountDate: '2026-08-01 10:00:00',
      createdBy: 'u1',
    });
    await dataSource
      .getRepository(AccountItem)
      .update({ id: 'i1' }, { shopCode: 'S1', fundId: 'f1' });

    const { items } = await service.userItems('u1', { page: 1, pageSize: 10 });

    expect(items[0].categoryName).toBe('餐饮');
    expect(items[0].shopName).toBe('沃尔玛');
    expect(items[0].fundName).toBe('现金');
  });
});
