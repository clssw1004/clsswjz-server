import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountNote } from '../pojo/entities/account-note.entity';
import { User } from '../pojo/entities/user.entity';
import { AttachmentEntity } from '../pojo/entities/attachment.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { UserShareEntity } from '../pojo/entities/user-share.entity';
import { BusinessType } from 'src/pojo/enums/business-type.enum';
import { OperateType } from 'src/pojo/enums/operate-type.enum';
import { LogResult } from 'src/pojo/dto/log-sync/sync.dto';

@Injectable()
export class LogRunner {
  constructor(
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountCategory)
    private accountCategoryRepository: Repository<AccountCategory>,
    @InjectRepository(AccountItem)
    private accountItemRepository: Repository<AccountItem>,
    @InjectRepository(AccountShop)
    private accountShopRepository: Repository<AccountShop>,
    @InjectRepository(AccountSymbol)
    private accountSymbolRepository: Repository<AccountSymbol>,
    @InjectRepository(AccountFund)
    private accountFundRepository: Repository<AccountFund>,
    @InjectRepository(AccountBookUser)
    private accountBookUserRepository: Repository<AccountBookUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AttachmentEntity)
    private attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  /**
   * 该业务类型是否可在服务端回放落库（含伪类型/暂跳过类型）。
   * MaterializeService 用它区分"可回放但失败（应重试）"与"不支持（应跳过）"。
   */
  supports(businessType: BusinessType): boolean {
    switch (businessType) {
      case BusinessType.BOOK:
      case BusinessType.CATEGORY:
      case BusinessType.ITEM:
      case BusinessType.SHOP:
      case BusinessType.SYMBOL:
      case BusinessType.FUND:
      case BusinessType.USER:
      case BusinessType.BOOK_MEMBER:
      case BusinessType.ATTACHMENT:
      case BusinessType.NOTE:
      case BusinessType.ROOT:
      case BusinessType.FUND_BOOK:
      case BusinessType.USER_SHARE:
        return true;
      default:
        return false;
    }
  }

  async runLogSync(
    log: LogSync,
    transaction: EntityManager,
  ): Promise<LogResult> {
    try {
      // ROOT 为伪类型；FUND_BOOK 服务端暂无对应实体，先跳过（不落库不报错）
      if (
        log.businessType === BusinessType.ROOT ||
        log.businessType === BusinessType.FUND_BOOK
      ) {
        return LogResult.success(log);
      }

      // 解析操作数据。部分 batchDelete 日志 operateData 为空串（仅靠 businessId），
      // 空串不解析，交由各分支按需退化处理
      const operateData = log.operateData
        ? JSON.parse(log.operateData)
        : null;

      // 根据业务类型获取对应的Repository
      const repository = this.getRepository(log.businessType, transaction);

      // 执行数据库操作（字段剥离在各分支内完成，避免把 batch 信封 {ids,data} 误当实体字段清掉）
      switch (log.operateType) {
        case OperateType.CREATE:
        case OperateType.BATCH_CREATE: {
          if (!operateData) {
            throw new Error('CREATE 日志缺少 operateData');
          }
          this.sanitizeAgainstEntity(repository, operateData);
          await repository.save(operateData);
          break;
        }
        case OperateType.UPDATE:
          // 真实 UPDATE：目标行不存在则 no-op，避免用部分字段 upsert 出残缺行
          // （客户端部分更新日志可能只带 updatedAt/updatedBy，甚至缺失 businessId）
          if (operateData && typeof operateData === 'object') {
            this.sanitizeAgainstEntity(repository, operateData);
            delete operateData.id;
          }
          if (log.businessId) {
            await repository.update(log.businessId, operateData ?? {});
          }
          break;
        case OperateType.BATCH_UPDATE:
          await this.applyBatchUpdate(repository, operateData);
          break;
        case OperateType.DELETE:
          await repository.delete(log.businessId);
          break;
        case OperateType.BATCH_DELETE: {
          const ids = this.extractBatchIds(operateData, log.businessId);
          if (ids.length) {
            await repository.delete(ids);
          }
          break;
        }
        default:
          throw new Error(`不支持的操作类型: ${log.operateType}`);
      }

      return LogResult.success(log);
    } catch (error) {
      return LogResult.error(log, error.message);
    }
  }

  /**
   * 批量更新：兼容客户端两种 operateData 结构
   *  1) { ids: [...], data: [对象 | "JSON串"] } —— ids 与 data 按索引一一对应
   *  2) 扁平数组 [{ id, ...字段 }]
   */
  private async applyBatchUpdate(
    repository: Repository<any>,
    data: any,
  ): Promise<void> {
    if (!data) return;
    const ids = Array.isArray(data) ? undefined : data.ids;
    const items = Array.isArray(data) ? data : data.data;
    if (!Array.isArray(items)) return;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      if (typeof item === 'string') {
        try {
          item = JSON.parse(item);
        } catch {
          continue;
        }
      }
      if (!item || typeof item !== 'object') continue;
      const id = (ids && ids[i]) || item.id;
      this.sanitizeAgainstEntity(repository, item);
      delete item.id;
      if (id) {
        await repository.update(id, item);
      }
    }
  }

  /**
   * 批量删除的 id 列表：兼容 {ids:[...]}、扁平数组；
   * operateData 为空时退化为按 businessId 单条删除。
   */
  private extractBatchIds(data: any, businessId?: string): string[] {
    if (Array.isArray(data)) {
      return data.filter((x) => typeof x === 'string');
    }
    if (data && Array.isArray(data.ids)) {
      return data.ids.filter((x: any) => typeof x === 'string');
    }
    if (!data && businessId) {
      return [businessId];
    }
    return [];
  }

  /**
   * 清空全部业务表（账本/分类/记账/账户/商家/标识/成员/附件）。
   * 用于"重头回放"：清空后从日志重新落库。不触碰 users / log_sync。
   */
  async clearAllBusinessData(transaction: EntityManager): Promise<void> {
    const entityClasses = [
      AccountBook,
      AccountCategory,
      AccountItem,
      AccountShop,
      AccountSymbol,
      AccountFund,
      AccountBookUser,
      AttachmentEntity,
      AccountNote,
      UserShareEntity,
    ];
    for (const cls of entityClasses) {
      await transaction.getRepository(cls).clear();
    }
  }

  /**
   * 剥离 operateData 中实体未建模的字段（就地修改）。
   * 客户端表可能有服务端实体没有的字段（如 lastAccountItemAt/source），
   * save() 会忽略它们，但 update() 会因未知字段报错，故统一剥离。
   */
  private sanitizeAgainstEntity(repository: Repository<any>, data: any): void {
    const columns = repository.metadata.columns.map((c) => c.propertyName);
    const clean = (obj: Record<string, any>) => {
      for (const key of Object.keys(obj)) {
        if (!columns.includes(key)) {
          delete obj[key];
        }
      }
    };
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && typeof item === 'object') {
          clean(item);
        }
      }
    } else if (data && typeof data === 'object') {
      clean(data);
    }
  }

  private getRepository(
    businessType: BusinessType,
    transaction: EntityManager,
  ): Repository<any> {
    switch (businessType) {
      case BusinessType.BOOK:
        return transaction.getRepository(AccountBook);
      case BusinessType.CATEGORY:
        return transaction.getRepository(AccountCategory);
      case BusinessType.ITEM:
        return transaction.getRepository(AccountItem);
      case BusinessType.SHOP:
        return transaction.getRepository(AccountShop);
      case BusinessType.SYMBOL:
        return transaction.getRepository(AccountSymbol);
      case BusinessType.FUND:
        return transaction.getRepository(AccountFund);
      case BusinessType.USER:
        return transaction.getRepository(User);
      case BusinessType.BOOK_MEMBER:
        return transaction.getRepository(AccountBookUser);
      case BusinessType.ATTACHMENT:
        return transaction.getRepository(AttachmentEntity);
      case BusinessType.NOTE:
        return transaction.getRepository(AccountNote);
      case BusinessType.USER_SHARE:
        return transaction.getRepository(UserShareEntity);
      default:
        throw new Error(`不支持的业务类型: ${businessType}`);
    }
  }
}
