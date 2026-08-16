import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';

/**
 * 管理台业务报表：查询日志回放落库后的业务表（account_books/account_items/...）。
 * 本期覆盖核心记账域（book/category/item/fund/shop/symbol）。
 */
@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(AccountBook)
    private readonly accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountItem)
    private readonly accountItemRepository: Repository<AccountItem>,
    @InjectRepository(AccountCategory)
    private readonly accountCategoryRepository: Repository<AccountCategory>,
    @InjectRepository(AccountShop)
    private readonly accountShopRepository: Repository<AccountShop>,
    @InjectRepository(AccountFund)
    private readonly accountFundRepository: Repository<AccountFund>,
    @InjectRepository(AccountBookUser)
    private readonly accountBookUserRepository: Repository<AccountBookUser>,
  ) {}

  /** 账本列表（报表筛选用），按创建时间倒序（最新创建在前，作为默认选中） */
  async listBooks(): Promise<
    { id: string; name: string; createdAt: number }[]
  > {
    const books = await this.accountBookRepository.find({
      order: { createdAt: 'DESC' },
    });
    return books.map((b) => ({ id: b.id, name: b.name, createdAt: b.createdAt }));
  }

  /** 平台收支总览；bookId 传入时限定单个账本。
   *  口径与移动端(Flutter)对齐：收入/支出取 |带符号求和|（客户端支出存负值），
   *  退款（source='item' 指向原支出）计入结余。 */
  async overview(bookId?: string) {
    const bookCount = bookId
      ? (await this.accountBookRepository.exist({ where: { id: bookId } })
          ? 1
          : 0)
      : await this.accountBookRepository.count();

    const sumQb = this.accountItemRepository
      .createQueryBuilder('i')
      .select(
        "COALESCE(SUM(CASE WHEN i.type = 'EXPENSE' THEN i.amount ELSE 0 END), 0)",
        'expense',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.type = 'INCOME' THEN i.amount ELSE 0 END), 0)",
        'income',
      );
    if (bookId) {
      sumQb.andWhere('i.accountBookId = :bookId', { bookId });
    }
    const sums = await sumQb.getRawOne();
    const expenseTotal = Math.abs(Number(sums?.expense ?? 0));
    const incomeTotal = Math.abs(Number(sums?.income ?? 0));
    const refundTotal = await this.refundTotal(bookId);

    const itemCount = bookId
      ? await this.accountItemRepository.count({ where: { accountBookId: bookId } })
      : await this.accountItemRepository.count();

    const categoryCount = bookId
      ? Number(
          (
            await this.accountItemRepository
              .createQueryBuilder('i')
              .select('COUNT(DISTINCT i.categoryCode)', 'count')
              .where('i.accountBookId = :bookId', { bookId })
              .andWhere('i.categoryCode IS NOT NULL')
              .getRawOne()
          )?.count ?? 0,
        )
      : await this.accountCategoryRepository.count();

    const active = await this.accountItemRepository
      .createQueryBuilder('i')
      .select('COUNT(DISTINCT i.createdBy)', 'count')
      .getRawOne();

    return {
      bookCount,
      itemCount,
      categoryCount,
      expenseTotal,
      incomeTotal,
      refundTotal,
      balance: incomeTotal - expenseTotal + refundTotal,
      activeUserCount: Number(active?.count ?? 0),
    };
  }

  /** 退款总额：收入型、source='item' 且 sourceId 指向本账本支出账目的记录 */
  private async refundTotal(bookId?: string): Promise<number> {
    const qb = this.accountItemRepository
      .createQueryBuilder('r')
      .select('COALESCE(SUM(ABS(r.amount)), 0)', 'total')
      .where(`r.source = 'item'`)
      .andWhere(
        `r.sourceId IN (SELECT id FROM ${this.accountItemRepository.metadata.tableName} WHERE type = 'EXPENSE')`,
      );
    if (bookId) {
      qb.andWhere('r.accountBookId = :bookId', { bookId });
    }
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  /** 收入分类的退款排除条件（与移动端一致：退款不计入收入分类） */
  private nonRefundIncomeWhere(alias: string): string {
    return `(${alias}.source IS NULL OR ${alias}.source != 'item' OR ${alias}.sourceId IS NULL OR ${alias}.sourceId NOT IN (SELECT id FROM ${this.accountItemRepository.metadata.tableName} WHERE type = 'EXPENSE'))`;
  }

  /** 收支趋势：按日/月分桶；bookId 传入时限定单个账本 */
  async trend(params: {
    granularity: 'day' | 'month';
    from?: string;
    to?: string;
    bookId?: string;
  }) {
    const bucket =
      params.granularity === 'month'
        ? 'substr(i.accountDate, 1, 7)'
        : 'substr(i.accountDate, 1, 10)';
    const qb = this.accountItemRepository
      .createQueryBuilder('i')
      .select(bucket, 'period')
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.type = 'EXPENSE' THEN i.amount ELSE 0 END), 0)",
        'expense',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.type = 'INCOME' THEN i.amount ELSE 0 END), 0)",
        'income',
      );
    if (params.bookId) {
      qb.andWhere('i.accountBookId = :bookId', { bookId: params.bookId });
    }
    if (params.from) {
      qb.andWhere('i.accountDate >= :from', { from: params.from });
    }
    if (params.to) {
      qb.andWhere('i.accountDate <= :to', {
        to: `${params.to} 23:59:59`,
      });
    }
    const rows = await qb.groupBy(bucket).orderBy(bucket, 'ASC').getRawMany();
    return rows.map((r) => ({
      period: r.period,
      expense: Math.abs(Number(r.expense)),
      income: Math.abs(Number(r.income)),
    }));
  }

  /** 分类占比：按分类聚合收支（口径与移动端一致）。
   *  金额取 |带符号求和|；收入分类排除退款（退款指向原支出，不计入收入）。 */
  async categories(type: 'EXPENSE' | 'INCOME', bookId?: string) {
    const qb = this.accountItemRepository
      .createQueryBuilder('i')
      .select('i.categoryCode', 'categoryCode')
      .addSelect('c.name', 'categoryName')
      .addSelect('ABS(SUM(i.amount))', 'amount')
      .addSelect('COUNT(*)', 'count')
      .innerJoin(AccountCategory, 'c', 'c.code = i.categoryCode')
      .where('i.type = :type', { type })
      .groupBy('i.categoryCode')
      .addGroupBy('c.name')
      .orderBy('amount', 'DESC');
    if (type === 'INCOME') {
      qb.andWhere(this.nonRefundIncomeWhere('i'));
    }
    if (bookId) {
      qb.andWhere('i.accountBookId = :bookId', { bookId });
    }
    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      categoryCode: r.categoryCode,
      categoryName: r.categoryName,
      amount: Number(r.amount),
      count: Number(r.count),
    }));
  }

  /** 账户资金分布：按账户聚合支出/收入（bookId 限定单账本） */
  async funds(bookId?: string) {
    const qb = this.accountItemRepository
      .createQueryBuilder('i')
      .select('i.fundId', 'fundId')
      .addSelect(
        "ABS(SUM(CASE WHEN i.type = 'EXPENSE' THEN i.amount ELSE 0 END))",
        'expense',
      )
      .addSelect(
        "SUM(CASE WHEN i.type = 'INCOME' THEN i.amount ELSE 0 END)",
        'income',
      )
      .addSelect('COUNT(*)', 'count')
      .where('i.fundId IS NOT NULL');
    if (bookId) {
      qb.andWhere('i.accountBookId = :bookId', { bookId });
    }
    const rows = await qb
      .groupBy('i.fundId')
      .orderBy('expense + income', 'DESC')
      .getRawMany();

    const fundIds = rows.map((r) => r.fundId);
    const funds = fundIds.length
      ? await this.accountFundRepository.findBy({ id: In(fundIds) })
      : [];
    const fundMap = new Map(funds.map((f) => [f.id, f.name]));

    return rows.map((r) => ({
      fundId: r.fundId,
      fundName: fundMap.get(r.fundId) ?? r.fundId,
      expense: Math.abs(Number(r.expense ?? 0)),
      income: Number(r.income ?? 0),
      count: Number(r.count),
    }));
  }

  /** 商户 Top：按商户聚合支出/收入，按支出降序（bookId 限定单账本） */
  async shops(bookId?: string) {
    const qb = this.accountItemRepository
      .createQueryBuilder('i')
      .select('i.shopCode', 'shopCode')
      .addSelect(
        "ABS(SUM(CASE WHEN i.type = 'EXPENSE' THEN i.amount ELSE 0 END))",
        'expense',
      )
      .addSelect(
        "SUM(CASE WHEN i.type = 'INCOME' THEN i.amount ELSE 0 END)",
        'income',
      )
      .addSelect('COUNT(*)', 'count')
      .where('i.shopCode IS NOT NULL');
    if (bookId) {
      qb.andWhere('i.accountBookId = :bookId', { bookId });
    }
    const rows = await qb
      .groupBy('i.shopCode')
      .orderBy('expense', 'DESC')
      .getRawMany();

    const shopCodes = rows.map((r) => r.shopCode);
    const shops = shopCodes.length
      ? await this.accountShopRepository.findBy({ code: In(shopCodes) })
      : [];
    const shopMap = new Map(shops.map((s) => [s.code, s.name]));

    return rows.map((r) => ({
      shopCode: r.shopCode,
      shopName: shopMap.get(r.shopCode) ?? r.shopCode,
      expense: Math.abs(Number(r.expense ?? 0)),
      income: Number(r.income ?? 0),
      count: Number(r.count),
    }));
  }

  /** 用户账本：创建的 + 作为成员加入的 */
  async userBooks(userId: string): Promise<AccountBook[]> {
    const created = await this.accountBookRepository
      .createQueryBuilder('b')
      .where('b.createdBy = :userId', { userId })
      .getMany();
    const memberships = await this.accountBookUserRepository
      .createQueryBuilder('rel')
      .select('rel.accountBookId')
      .where('rel.userId = :userId', { userId })
      .getMany();
    const memberIds = memberships.map((r) => r.accountBookId);
    const memberBooks = memberIds.length
      ? await this.accountBookRepository
          .createQueryBuilder('b')
          .where('b.id IN (:...ids)', { ids: memberIds })
          .getMany()
      : [];
    return [...created, ...memberBooks];
  }

  /** 用户记账明细（限定其账本） */
  async userItems(userId: string, params: { page: number; pageSize: number }) {
    const books = await this.userBooks(userId);
    const bookIds = books.map((b) => b.id);
    if (bookIds.length === 0) {
      return {
        items: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
      };
    }
    const [items, total] = await this.accountItemRepository
      .createQueryBuilder('i')
      .where('i.accountBookId IN (:...bookIds)', { bookIds })
      .orderBy('i.accountDate', 'DESC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount();

    // 解析显示名称：分类/商户/账户（管理台展示用）
    const categoryCodes = [
      ...new Set(items.map((i) => i.categoryCode).filter(Boolean)),
    ];
    const shopCodes = [
      ...new Set(items.map((i) => i.shopCode).filter(Boolean)),
    ];
    const fundIds = [...new Set(items.map((i) => i.fundId).filter(Boolean))];
    const [categories, shops, funds] = await Promise.all([
      categoryCodes.length
        ? this.accountCategoryRepository.findBy({ code: In(categoryCodes) })
        : Promise.resolve([]),
      shopCodes.length
        ? this.accountShopRepository.findBy({ code: In(shopCodes) })
        : Promise.resolve([]),
      fundIds.length
        ? this.accountFundRepository.findBy({ id: In(fundIds) })
        : Promise.resolve([]),
    ]);
    const categoryMap = new Map(categories.map((c) => [c.code, c.name]));
    const shopMap = new Map(shops.map((s) => [s.code, s.name]));
    const fundMap = new Map(funds.map((f) => [f.id, f.name]));

    const enriched = items.map((item) => ({
      ...item,
      categoryName: item.categoryCode
        ? categoryMap.get(item.categoryCode)
        : undefined,
      shopName: item.shopCode ? shopMap.get(item.shopCode) : undefined,
      fundName: item.fundId ? fundMap.get(item.fundId) : undefined,
    }));
    return {
      items: enriched,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
