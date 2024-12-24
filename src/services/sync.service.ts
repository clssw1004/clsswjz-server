import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { BaseEntity } from '../pojo/entities/base.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBookFund } from '../pojo/entities/account-book-fund.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { SyncDataDto, SyncChangesDto } from '../pojo/dto/sync/sync-data.dto';
import { parseTimestamp } from '../utils/date.util';

@Injectable()
export class SyncService {
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
    @InjectRepository(AccountBookFund)
    private accountBookFundRepository: Repository<AccountBookFund>,
    @InjectRepository(AccountBookUser)
    private accountBookUserRepository: Repository<AccountBookUser>,
  ) {}

  /**
   * 获取初始数据
   */
  async getInitialData(userId: string) {
    const [
      accountBooks,
      accountCategories,
      accountItems,
      accountShops,
      accountSymbols,
      accountFunds,
      accountBookFunds,
      accountBookUsers,
    ] = await Promise.all([
      this.accountBookRepository.find({
        where: { createdBy: userId },
      }),
      this.accountCategoryRepository.find({
        where: { createdBy: userId },
      }),
      this.accountItemRepository.find({
        where: { createdBy: userId },
      }),
      this.accountShopRepository.find({
        where: { createdBy: userId },
      }),
      this.accountSymbolRepository.find({
        where: { createdBy: userId },
      }),
      this.accountFundRepository.find({
        where: { createdBy: userId },
      }),
      this.accountBookFundRepository.find(),
      this.accountBookUserRepository.find({
        where: { userId },
      }),
    ]);

    return {
      accountBooks,
      accountCategories,
      accountItems,
      accountShops,
      accountSymbols,
      accountFunds,
      accountBookFunds,
      accountBookUsers,
    };
  }

  /**
   * 批量同步数据
   */
  async syncBatch(syncData: SyncDataDto, userId: string) {
    const { lastSyncTime, changes } = syncData;

    // 获取服务器端的变更
    const serverChanges = await this.getServerChanges(lastSyncTime, userId);

    // 处理客户端的变更
    const conflicts = await this.processClientChanges(changes, userId);

    return {
      serverChanges,
      conflicts,
    };
  }

  /**
   * 获取服务器端的变更
   */
  private async getServerChanges(lastSyncTime: string, userId: string) {
    const timestamp = parseTimestamp(lastSyncTime);

    const [
      accountBooks,
      accountCategories,
      accountItems,
      accountShops,
      accountSymbols,
      accountFunds,
      accountBookFunds,
      accountBookUsers,
    ] = await Promise.all([
      this.accountBookRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
          createdBy: userId,
        },
      }),
      this.accountCategoryRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
          createdBy: userId,
        },
      }),
      this.accountItemRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
          createdBy: userId,
        },
      }),
      this.accountShopRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
          createdBy: userId,
        },
      }),
      this.accountSymbolRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
          createdBy: userId,
        },
      }),
      this.accountFundRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
          createdBy: userId,
        },
      }),
      this.accountBookFundRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
        },
      }),
      this.accountBookUserRepository.find({
        where: {
          updatedAt: MoreThan(timestamp),
          userId,
        },
      }),
    ]);

    return {
      accountBooks,
      accountCategories,
      accountItems,
      accountShops,
      accountSymbols,
      accountFunds,
      accountBookFunds,
      accountBookUsers,
    };
  }

  /**
   * 处理客户端的变更
   */
  private async processClientChanges(changes: SyncChangesDto, userId: string) {
    const conflicts = {
      accountBooks: [],
      accountCategories: [],
      accountItems: [],
      accountShops: [],
      accountSymbols: [],
      accountFunds: [],
      accountBookFunds: [],
      accountBookUsers: [],
    };

    if (!changes) return conflicts;

    await Promise.all([
      this.processEntityChanges(
        changes.accountBooks,
        this.accountBookRepository,
        conflicts.accountBooks,
      ),
      this.processEntityChanges(
        changes.accountCategories,
        this.accountCategoryRepository,
        conflicts.accountCategories,
      ),
      this.processEntityChanges(
        changes.accountItems,
        this.accountItemRepository,
        conflicts.accountItems,
      ),
      this.processEntityChanges(
        changes.accountShops,
        this.accountShopRepository,
        conflicts.accountShops,
      ),
      this.processEntityChanges(
        changes.accountSymbols,
        this.accountSymbolRepository,
        conflicts.accountSymbols,
      ),
      this.processEntityChanges(
        changes.accountFunds,
        this.accountFundRepository,
        conflicts.accountFunds,
      ),
      this.processEntityChanges(
        changes.accountBookFunds,
        this.accountBookFundRepository,
        conflicts.accountBookFunds,
      ),
      this.processEntityChanges(
        changes.accountBookUsers,
        this.accountBookUserRepository,
        conflicts.accountBookUsers,
      ),
    ]);

    return conflicts;
  }

  /**
   * 处理实体变更
   */
  private async processEntityChanges<T extends BaseEntity>(
    entities: T[],
    repository: Repository<T>,
    conflicts: T[],
  ) {
    if (!entities?.length) return;

    for (const entity of entities) {
      try {
        const existing = await repository.findOne({
          where: { id: (entity as any).id },
        });

        if (existing) {
          // 检查版本冲突
          if (existing.updatedAt > (entity as any).updatedAt) {
            conflicts.push(existing);
            continue;
          }
        }

        await repository.save(entity);
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
  }
}
