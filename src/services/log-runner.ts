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
import { User } from '../pojo/entities/user.entity';
import { AttachmentEntity } from '../pojo/entities/attachment.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
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
      case BusinessType.ROOT:
      case BusinessType.FUND_BOOK:
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

      // 解析操作数据
      const operateData = JSON.parse(log.operateData);

      // 根据业务类型获取对应的Repository
      const repository = this.getRepository(log.businessType, transaction);

      // 执行数据库操作
      switch (log.operateType) {
        case OperateType.CREATE:
        case OperateType.BATCH_CREATE:
          await repository.save(operateData);
          break;
        case OperateType.UPDATE:
          // 真实 UPDATE：目标行不存在则 no-op，避免用部分字段 upsert 出残缺行
          // （客户端部分更新日志可能只带 updatedAt/updatedBy，甚至缺失 businessId）
          delete operateData.id;
          if (log.businessId) {
            await repository.update(log.businessId, operateData);
          }
          break;
        case OperateType.BATCH_UPDATE:
          for (const item of operateData as any[]) {
            const id = item?.id;
            delete item?.id;
            if (id) {
              await repository.update(id, item);
            }
          }
          break;
        case OperateType.DELETE:
          await repository.delete(log.businessId);
          break;
        case OperateType.BATCH_DELETE:
          await repository.delete(operateData);
          break;
        default:
          throw new Error(`不支持的操作类型: ${log.operateType}`);
      }

      return LogResult.success(log);
    } catch (error) {
      return LogResult.error(log, error.message);
    }
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
    ];
    for (const cls of entityClasses) {
      await transaction.getRepository(cls).clear();
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
      default:
        throw new Error(`不支持的业务类型: ${businessType}`);
    }
  }
}
