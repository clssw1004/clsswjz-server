import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { BusinessType } from '../pojo/enums/business-type.enum';
import { OperateType } from '../pojo/enums/operate-type.enum';
import { SyncState } from '../pojo/enums/sync-state.enum';
import { MaterializeService } from './materialize.service';
import { generatePrimaryKey } from '../utils/id.util';
import { now } from '../utils/date.util';
import type { MaintenanceEntityType } from '../pojo/dto/admin/admin-maintenance.dto';

/**
 * 批量数据维护（分类/商户/标签）。
 * 关键约束：不直接改业务表，而是生成 LogSync 日志（走同步链路）：
 *   1) 日志落库后由 MaterializeService 回放 → 管理台报表即时生效
 *   2) 客户端 pull 时按账本作用域同步 → 各端数据收敛一致
 * 这样避免「直接改表」导致服务端与客户端不一致。
 */
@Injectable()
export class AdminMaintenanceService {
  constructor(
    @InjectRepository(AccountBook)
    private readonly bookRepository: Repository<AccountBook>,
    @InjectRepository(AccountItem)
    private readonly itemRepository: Repository<AccountItem>,
    @InjectRepository(AccountCategory)
    private readonly categoryRepository: Repository<AccountCategory>,
    @InjectRepository(AccountShop)
    private readonly shopRepository: Repository<AccountShop>,
    @InjectRepository(AccountSymbol)
    private readonly symbolRepository: Repository<AccountSymbol>,
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    private readonly materializeService: MaterializeService,
  ) {}

  private repo(type: MaintenanceEntityType): Repository<any> {
    switch (type) {
      case 'category':
        return this.categoryRepository;
      case 'shop':
        return this.shopRepository;
      case 'symbol':
        return this.symbolRepository;
    }
  }

  private businessType(type: MaintenanceEntityType): BusinessType {
    switch (type) {
      case 'category':
        return BusinessType.CATEGORY;
      case 'shop':
        return BusinessType.SHOP;
      case 'symbol':
        return BusinessType.SYMBOL;
    }
  }

  /** item 上引用该实体 code 的列名 */
  private itemCodeField(type: MaintenanceEntityType): string {
    switch (type) {
      case 'category':
        return 'categoryCode';
      case 'shop':
        return 'shopCode';
      case 'symbol':
        return 'projectCode';
    }
  }

  /** 列出账本下某类数据字典，附每项被账目引用的笔数 */
  async listEntities(bookId: string, type: MaintenanceEntityType) {
    await this.ensureBook(bookId);
    const repo = this.repo(type);
    const entities = await repo
      .createQueryBuilder('e')
      .where('e.accountBookId = :bookId', { bookId })
      .orderBy('e.name', 'ASC')
      .getMany();

    const codeField = this.itemCodeField(type);
    const counts = await this.itemRepository
      .createQueryBuilder('i')
      .select(`i.${codeField}`, 'code')
      .addSelect('COUNT(*)', 'count')
      .where('i.accountBookId = :bookId', { bookId })
      .andWhere(`i.${codeField} IS NOT NULL`)
      .groupBy(`i.${codeField}`)
      .getRawMany();
    const countMap = new Map(counts.map((r) => [r.code, Number(r.count)]));

    return entities.map((e) => ({
      id: e.id,
      code: e.code,
      name: e.name,
      itemCount: countMap.get(e.code) ?? 0,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }

  /** 批量重命名：生成 UPDATE 日志 */
  async rename(params: {
    bookId: string;
    type: MaintenanceEntityType;
    id: string;
    name: string;
  }) {
    const { bookId, type, id, name } = params;
    const entity = await this.repo(type).findOneBy({ id });
    if (!entity || entity.accountBookId !== bookId) {
      throw new NotFoundException('待维护的实体不存在');
    }
    if (!name.trim()) throw new BadRequestException('名称不能为空');

    const operatorId = await this.ownerId(bookId);
    await this.createLog({
      businessType: this.businessType(type),
      operateType: OperateType.UPDATE,
      bookId,
      businessId: id,
      operatorId,
      operateData: { name: name.trim(), updatedAt: now(), updatedBy: operatorId },
    });
    await this.flush();
    return { id, name: name.trim() };
  }

  /** 批量删除：逐条生成 DELETE 日志 */
  async delete(params: {
    bookId: string;
    type: MaintenanceEntityType;
    ids: string[];
  }) {
    const { bookId, type, ids } = params;
    const repo = this.repo(type);
    if (!ids.length) throw new BadRequestException('未选择要删除的项');
    const entities = await repo.findBy({ id: In(ids) });
    if (entities.length !== ids.length) {
      throw new NotFoundException('部分待删除实体不存在');
    }
    const operatorId = await this.ownerId(bookId);
    for (const e of entities) {
      await this.createLog({
        businessType: this.businessType(type),
        operateType: OperateType.DELETE,
        bookId,
        businessId: e.id,
        operatorId,
        operateData: {},
      });
    }
    await this.flush();
    return { deleted: entities.map((e) => e.id) };
  }

  /** 批量合并：from 的账目引用改指 to，再删除 from（全程日志驱动） */
  async merge(params: {
    bookId: string;
    type: MaintenanceEntityType;
    fromId: string;
    toId: string;
  }) {
    const { bookId, type, fromId, toId } = params;
    if (fromId === toId) throw new BadRequestException('不能合并到自身');

    const repo = this.repo(type);
    const [from, to] = await Promise.all([
      repo.findOneBy({ id: fromId }),
      repo.findOneBy({ id: toId }),
    ]);
    if (!from || from.accountBookId !== bookId || !to || to.accountBookId !== bookId) {
      throw new NotFoundException('合并的实体不存在或不在该账本');
    }

    const codeField = this.itemCodeField(type);
    const operatorId = await this.ownerId(bookId);
    // 找出引用 from 的账目
    const items = await this.itemRepository
      .createQueryBuilder('i')
      .select('i.id', 'id')
      .where('i.accountBookId = :bookId', { bookId })
      .andWhere(`i.${codeField} = :code`, { code: from.code })
      .getRawMany();
    const itemIds = items.map((r) => r.id);

    // 1) 重定向账目引用（ITEM BATCH_UPDATE 日志）
    if (itemIds.length) {
      const opAt = now();
      await this.createLog({
        businessType: BusinessType.ITEM,
        operateType: OperateType.BATCH_UPDATE,
        bookId,
        businessId: itemIds[0],
        operatorId,
        operatedAt: opAt,
        operateData: {
          ids: itemIds,
          data: itemIds.map(() =>
            JSON.stringify({ [codeField]: to.code, updatedAt: opAt, updatedBy: operatorId }),
          ),
        },
      });
    }
    // 2) 删除 from 实体（稍后一点确保重定向先回放）
    await this.createLog({
      businessType: this.businessType(type),
      operateType: OperateType.DELETE,
      bookId,
      businessId: fromId,
      operatorId,
      operatedAt: now() + 1,
      operateData: {},
    });
    await this.flush();
    return {
      merged: fromId,
      into: toId,
      reassignedItems: itemIds.length,
    };
  }

  /* ---------- 内部 ---------- */

  private async ensureBook(bookId: string): Promise<void> {
    const book = await this.bookRepository.findOneBy({ id: bookId });
    if (!book) throw new NotFoundException('账本不存在');
  }

  /** 操作人取账本创建者（真实用户，日志可被成员 pull 同步） */
  private async ownerId(bookId: string): Promise<string> {
    const book = await this.bookRepository.findOneBy({ id: bookId });
    if (!book) throw new NotFoundException('账本不存在');
    return book.createdBy;
  }

  private async createLog(params: {
    businessType: BusinessType;
    operateType: OperateType;
    bookId: string;
    businessId: string;
    operatorId: string;
    operatedAt?: number;
    operateData: any;
  }): Promise<LogSync> {
    const opAt = params.operatedAt ?? now();
    const log = this.logSyncRepository.create({
      id: generatePrimaryKey(),
      businessType: params.businessType,
      operateType: params.operateType,
      parentType: 'book',
      parentId: params.bookId,
      operatorId: params.operatorId,
      operatedAt: opAt,
      businessId: params.businessId,
      operateData:
        typeof params.operateData === 'string'
          ? params.operateData
          : JSON.stringify(params.operateData),
      syncState: SyncState.SYNCED,
      syncTime: opAt,
    } as Partial<LogSync>) as LogSync;
    return this.logSyncRepository.save(log);
  }

  /** 回放新生成的日志，使业务表即时更新 */
  private async flush(): Promise<void> {
    await this.materializeService.flush();
  }
}
