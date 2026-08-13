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

  /** 平台收支总览 */
  async overview() {
    const bookCount = await this.accountBookRepository.count();
    const itemCount = await this.accountItemRepository.count();
    const categoryCount = await this.accountCategoryRepository.count();

    const sums = await this.accountItemRepository
      .createQueryBuilder('i')
      .select(
        "COALESCE(SUM(CASE WHEN i.type = 'EXPENSE' THEN i.amount ELSE 0 END), 0)",
        'expense',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN i.type = 'INCOME' THEN i.amount ELSE 0 END), 0)",
        'income',
      )
      .getRawOne();
    const expenseTotal = Number(sums?.expense ?? 0);
    const incomeTotal = Number(sums?.income ?? 0);

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
      balance: incomeTotal - expenseTotal,
      activeUserCount: Number(active?.count ?? 0),
    };
  }

  /** 收支趋势：按日/月分桶 */
  async trend(params: {
    granularity: 'day' | 'month';
    from?: string;
    to?: string;
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
      expense: Number(r.expense),
      income: Number(r.income),
    }));
  }

  /** 分类占比：按分类聚合收支 */
  async categories(type: 'EXPENSE' | 'INCOME') {
    const rows = await this.accountItemRepository
      .createQueryBuilder('i')
      .select('i.categoryCode', 'categoryCode')
      .addSelect('c.name', 'categoryName')
      .addSelect('SUM(i.amount)', 'amount')
      .innerJoin(AccountCategory, 'c', 'c.code = i.categoryCode')
      .where('i.type = :type', { type })
      .groupBy('i.categoryCode')
      .addGroupBy('c.name')
      .orderBy('amount', 'DESC')
      .getRawMany();
    return rows.map((r) => ({
      categoryCode: r.categoryCode,
      categoryName: r.categoryName,
      amount: Number(r.amount),
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
