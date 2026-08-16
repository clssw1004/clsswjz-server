import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { User } from '../pojo/entities/user.entity';

/**
 * 管理台账目模块：按账本分页展示账目、账目详情 + 变迁时间线。
 * 与业务报表共用账本维度（跨账本统计无意义）。
 */
@Injectable()
export class AdminItemService {
  constructor(
    @InjectRepository(AccountItem)
    private readonly itemRepository: Repository<AccountItem>,
    @InjectRepository(AccountCategory)
    private readonly categoryRepository: Repository<AccountCategory>,
    @InjectRepository(AccountShop)
    private readonly shopRepository: Repository<AccountShop>,
    @InjectRepository(AccountFund)
    private readonly fundRepository: Repository<AccountFund>,
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 某账本的分页账目列表（含名称解析；支持类型/分类/账户/商户/月份多维过滤） */
  async listItems(
    bookId: string,
    params: {
      page: number;
      pageSize: number;
      type?: string;
      categoryCodes?: string;
      fundIds?: string;
      shopCodes?: string;
      month?: string;
    },
  ) {
    const qb = this.itemRepository
      .createQueryBuilder('i')
      .where('i.accountBookId = :bookId', { bookId });
    if (params.type) {
      qb.andWhere('i.type = :type', { type: params.type });
    }
    this.applyInFilter(qb, 'i.categoryCode', params.categoryCodes);
    this.applyInFilter(qb, 'i.fundId', params.fundIds);
    this.applyInFilter(qb, 'i.shopCode', params.shopCodes);
    if (params.month) {
      qb.andWhere('i.accountDate LIKE :month', { month: `${params.month}%` });
    }
    const [items, total] = await qb
      .orderBy('i.accountDate', 'DESC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount();

    const enriched = await this.enrichNames(items);
    return {
      items: enriched,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /** 逗号分隔值 → IN 过滤 */
  private applyInFilter(
    qb: import('typeorm').SelectQueryBuilder<AccountItem>,
    column: string,
    raw: string | undefined,
  ): void {
    if (!raw) return;
    const values = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (values.length) {
      qb.andWhere(`${column} IN (:...values)`, { values });
    }
  }

  /** 账目详情 + 该账目的全部日志（按操作时间正序，构成变迁时间线）
   *  同时返回日志中出现的分类/商户/账户编码→名称映射，供前端翻译 */
  async getItemDetail(itemId: string) {
    const item = await this.itemRepository.findOneBy({ id: itemId });
    if (!item) {
      throw new NotFoundException('账目不存在');
    }
    const [detail] = await this.enrichNames([item]);

    const logs = await this.logSyncRepository.find({
      where: { businessId: itemId },
      order: { operatedAt: 'ASC' },
    });
    // 操作人名称
    const operatorIds = [
      ...new Set(logs.map((l) => l.operatorId).filter(Boolean)),
    ];
    const operators = operatorIds.length
      ? await this.userRepository.findBy({ id: In(operatorIds) })
      : [];
    const operatorNameMap = new Map(
      operators.map((u) => [u.id, u.nickname || u.username]),
    );

    const parsed = logs.map((l) => ({
      id: l.id,
      businessType: l.businessType,
      operateType: l.operateType,
      operatedAt: l.operatedAt,
      operatorId: l.operatorId,
      operatorName: operatorNameMap.get(l.operatorId),
      parentId: l.parentId,
      syncState: l.syncState,
      operateData: this.parseOperateData(l.operateData),
    }));

    const nameMap = await this.resolveRefNames(parsed);

    return {
      item: detail,
      logs: parsed,
      nameMap,
    };
  }

  /** 收集日志 operateData 中引用的分类/商户/账户编码，并解析为名称 */
  private async resolveRefNames(
    logs: Array<{ operateData: any }>,
  ): Promise<{
    categories: Record<string, string>;
    shops: Record<string, string>;
    funds: Record<string, string>;
  }> {
    const categoryCodes = new Set<string>();
    const shopCodes = new Set<string>();
    const fundIds = new Set<string>();
    for (const l of logs) {
      this.collectRefCodes(l.operateData, categoryCodes, shopCodes, fundIds);
    }
    const [categories, shops, funds] = await Promise.all([
      categoryCodes.size
        ? this.categoryRepository.findBy({ code: In([...categoryCodes]) })
        : Promise.resolve([]),
      shopCodes.size
        ? this.shopRepository.findBy({ code: In([...shopCodes]) })
        : Promise.resolve([]),
      fundIds.size
        ? this.fundRepository.findBy({ id: In([...fundIds]) })
        : Promise.resolve([]),
    ]);
    return {
      categories: Object.fromEntries(categories.map((c) => [c.code, c.name])),
      shops: Object.fromEntries(shops.map((s) => [s.code, s.name])),
      funds: Object.fromEntries(funds.map((f) => [f.id, f.name])),
    };
  }

  /** 递归收集引用编码（支持 batch 信封 {ids, data:[json串]}） */
  private collectRefCodes(
    data: any,
    categoryCodes: Set<string>,
    shopCodes: Set<string>,
    fundIds: Set<string>,
  ): void {
    if (!data || typeof data !== 'object') return;
    if (Array.isArray(data)) {
      for (const d of data) {
        this.collectRefCodes(d, categoryCodes, shopCodes, fundIds);
      }
      return;
    }
    if (data.categoryCode) categoryCodes.add(data.categoryCode);
    if (data.shopCode) shopCodes.add(data.shopCode);
    if (data.fundId) fundIds.add(data.fundId);
    if (Array.isArray(data.data)) {
      for (const d of data.data) {
        this.collectRefCodes(
          typeof d === 'string' ? this.parseOperateData(d) : d,
          categoryCodes,
          shopCodes,
          fundIds,
        );
      }
    }
  }

  /** 解析分类/商户/账户名称 */
  private async enrichNames(items: AccountItem[]) {
    const categoryCodes = [
      ...new Set(items.map((i) => i.categoryCode).filter(Boolean)),
    ];
    const shopCodes = [
      ...new Set(items.map((i) => i.shopCode).filter(Boolean)),
    ];
    const fundIds = [...new Set(items.map((i) => i.fundId).filter(Boolean))];
    const [categories, shops, funds] = await Promise.all([
      categoryCodes.length
        ? this.categoryRepository.findBy({ code: In(categoryCodes) })
        : Promise.resolve([]),
      shopCodes.length
        ? this.shopRepository.findBy({ code: In(shopCodes) })
        : Promise.resolve([]),
      fundIds.length
        ? this.fundRepository.findBy({ id: In(fundIds) })
        : Promise.resolve([]),
    ]);
    const categoryMap = new Map(categories.map((c) => [c.code, c.name]));
    const shopMap = new Map(shops.map((s) => [s.code, s.name]));
    const fundMap = new Map(funds.map((f) => [f.id, f.name]));

    return items.map((item) => ({
      ...item,
      categoryName: item.categoryCode
        ? categoryMap.get(item.categoryCode)
        : undefined,
      shopName: item.shopCode ? shopMap.get(item.shopCode) : undefined,
      fundName: item.fundId ? fundMap.get(item.fundId) : undefined,
    }));
  }

  private parseOperateData(raw: string): any {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}
