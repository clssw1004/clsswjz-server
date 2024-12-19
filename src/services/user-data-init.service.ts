import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { AccountFund, FundType } from '../pojo/entities/account-fund.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountBookFund } from '../pojo/entities/account-book-fund.entity';
import { AccountCategoryService } from './account-category.service';
import { Currency } from '../pojo/enums/currency.enum';

@Injectable()
export class UserDataInitService {
  constructor(
    @InjectRepository(AccountFund)
    private accountFundRepository: Repository<AccountFund>,
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountBookUser)
    private accountBookUserRepository: Repository<AccountBookUser>,
    @InjectRepository(AccountBookFund)
    private accountBookFundRepository: Repository<AccountBookFund>,
    private categoryService: AccountCategoryService,
  ) {}

  /**
   * 初始化用户默认资产
   */
  private async initializeDefaultFund(
    manager: EntityManager,
    userId: string,
  ): Promise<AccountFund> {
    const defaultFund = this.accountFundRepository.create({
      name: '现金',
      fundType: FundType.CASH,
      fundBalance: 0,
      fundRemark: '默认账户',
      createdBy: userId,
      updatedBy: userId,
    });
    return await manager.save(defaultFund);
  }

  /**
   * 初始化用户默认账本
   */
  private async initializeDefaultBook(
    manager: EntityManager,
    userId: string,
  ): Promise<AccountBook> {
    const defaultBook = this.accountBookRepository.create({
      name: '日常花销',
      description: '默认账本',
      currencySymbol: Currency.CNY,
      createdBy: userId,
      updatedBy: userId,
    });
    return await manager.save(defaultBook);
  }

  /**
   * 建立账本与用户的关联关系
   */
  private async createBookUserRelation(
    manager: EntityManager,
    userId: string,
    bookId: string,
  ): Promise<void> {
    const bookUserRelation = this.accountBookUserRepository.create({
      userId,
      accountBookId: bookId,
      // 设置所有权限为 true
      canViewBook: true,
      canEditBook: true,
      canDeleteBook: true,
      canViewItem: true,
      canEditItem: true,
      canDeleteItem: true,
    });
    await manager.save(bookUserRelation);
  }

  /**
   * 建立账本与资金账户的关联关系
   */
  private async createBookFundRelation(
    manager: EntityManager,
    bookId: string,
    fundId: string,
  ): Promise<void> {
    const bookFundRelation = this.accountBookFundRepository.create({
      accountBookId: bookId,
      fundId: fundId,
      fundIn: true,
      fundOut: true,
      isDefault: true,
    });
    await manager.save(bookFundRelation);
  }

  /**
   * 执行所有用户数据初始化操作
   */
  async initializeUserData(userId: string): Promise<void> {
    await this.accountFundRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. 创建默认资金账户
        const defaultFund = await this.initializeDefaultFund(
          transactionalEntityManager,
          userId,
        );

        // 2. 创建默认账本
        const defaultBook = await this.initializeDefaultBook(
          transactionalEntityManager,
          userId,
        );

        // 3. 建立账本与用户的关联关系
        await this.createBookUserRelation(
          transactionalEntityManager,
          userId,
          defaultBook.id,
        );

        // 4. 建立账本与资金账户的关联关系
        await this.createBookFundRelation(
          transactionalEntityManager,
          defaultBook.id,
          defaultFund.id,
        );

        // 5. 创建默认分类
        await this.categoryService.createDefaultCategories(
          transactionalEntityManager,
          defaultBook.id,
          userId,
        );
      },
    );
  }
}
