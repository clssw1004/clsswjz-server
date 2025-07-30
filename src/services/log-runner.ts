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
  ) {}

  async runLogSync(
    log: LogSync,
    transaction: EntityManager,
  ): Promise<LogResult> {
    try {
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
        case OperateType.BATCH_UPDATE:
          operateData.id = log.businessId;
          await repository.save(operateData);
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
      default:
        throw new Error(`不支持的业务类型: ${businessType}`);
    }
  }
}
