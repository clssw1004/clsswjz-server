import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { Category } from '../pojo/entities/category.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookFund } from '../pojo/entities/account-book-fund.entity';
import { CreateAccountItemDto } from '../pojo/dto/account-item/create-account-item.dto';
import { UpdateAccountItemDto } from '../pojo/dto/account-item/update-account-item.dto';
import { ItemType } from '../pojo/enums/item-type.enum';
import { QueryAccountItemDto } from '../pojo/dto/account-item/query-account-item.dto';
import { CategoryService } from './category.service';
import { AccountShopService } from './account-shop.service';
import { generateUid } from '../utils/id.util';
import { DEFAULT_FUND } from 'src/config/default-fund.config';
import { AccountBookUser } from 'src/pojo/entities/account-book-user.entity';
import { AttachmentService } from './attachment.service';
import { BusinessCode } from '../pojo/entities/attachment.entity';

@Injectable()
export class AccountItemService {
  constructor(
    @InjectRepository(AccountItem)
    private accountItemRepository: Repository<AccountItem>,
    private categoryService: CategoryService,
    private accountShopService: AccountShopService,
    private attachmentService: AttachmentService,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountBookFund)
    private accountBookFundRepository: Repository<AccountBookFund>,
  ) {}

  static readonly ALL_COLUMNS = [
    'item.id as id',
    'item.amount as amount',
    'item.type as type',
    'item.category_code as categoryCode',
    'item.shop_code as shopCode',
    'item.description as description',
    'item.account_book_id as accountBookId',
    'item.fund_id as fundId',
    'item.created_at as createdAt',
    'item.updated_at as updatedAt',
    'item.created_by as createdBy',
    'item.updated_by as updatedBy',
    'item.account_date as accountDate',
  ];
  /**
   * 获取或创建分类
   * @param categoryName 分类名称
   * @param accountBookId 账本ID
   * @param userId 用户ID
   * @returns 分类对象
   */
  private async getOrCreateCategory(
    categoryName: string,
    categoryType: ItemType,
    accountBookId: string,
    userId: string,
  ): Promise<Category> {
    let category = await this.categoryRepository.findOneBy({
      name: categoryName,
      accountBookId,
    });

    if (!category) {
      category = this.categoryRepository.create({
        code: generateUid(),
        name: categoryName,
        categoryType,
        accountBookId,
        createdBy: userId,
        updatedBy: userId,
      });
      await this.categoryRepository.save(category);
    }
    return category;
  }

  /**
   * 校验账本资产权限
   */
  private async validateBookFundPermission(
    accountBookId: string,
    fundId: string,
    type: ItemType,
  ): Promise<void> {
    if (fundId === DEFAULT_FUND) {
      return;
    }
    const bookFund = await this.accountBookFundRepository.findOne({
      where: {
        accountBookId,
        fundId,
      },
    });

    if (!bookFund) {
      throw new ForbiddenException('该账本未关联此账户');
    }

    if (type === ItemType.EXPENSE && !bookFund.fundOut) {
      throw new ForbiddenException('该账户在当前账本中不允许支出');
    }

    if (type === ItemType.INCOME && !bookFund.fundIn) {
      throw new ForbiddenException('该账户在当前账本中不允许收入');
    }
  }

  async create(createAccountItemDto: CreateAccountItemDto, userId: string) {
    // 使用事务来确保账目和附件的创建是原子操作
    return await this.accountItemRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 校验账本是否存在
        const accountBook = await this.accountBookRepository.findOneBy({
          id: createAccountItemDto.accountBookId,
        });
        if (!accountBook) {
          throw new NotFoundException(
            `账本ID ${createAccountItemDto.accountBookId} 不存在`,
          );
        }

        // 校验账本资产权限
        await this.validateBookFundPermission(
          createAccountItemDto.accountBookId,
          createAccountItemDto.fundId,
          createAccountItemDto.type,
        );

        // 处理分类
        const category = await this.getOrCreateCategory(
          createAccountItemDto.category,
          createAccountItemDto.type,
          createAccountItemDto.accountBookId,
          userId,
        );

        // 处理商家信息
        let shopCode = null;
        if (createAccountItemDto.shop) {
          const shop = await this.accountShopService.getOrCreateShop(
            createAccountItemDto.shop,
            createAccountItemDto.accountBookId,
            userId,
          );
          shopCode = shop.shopCode;
        }

        // 创建账目
        const accountItem = this.accountItemRepository.create({
          ...createAccountItemDto,
          shopCode,
          categoryCode: category.code,
          createdBy: createAccountItemDto.createdBy || userId,
          updatedBy: createAccountItemDto.createdBy || userId,
        });

        const savedAccountItem =
          await transactionalEntityManager.save(accountItem);

        // 更新分类的最近账目时间
        await this.categoryRepository.update(
          { code: category.code },
          { lastAccountItemAt: savedAccountItem.createdAt },
        );

        // 处理附件上传
        if (
          createAccountItemDto.files &&
          createAccountItemDto.files.length > 0
        ) {
          await this.attachmentService.createBatch(
            BusinessCode.ITEM,
            savedAccountItem.id,
            createAccountItemDto.files,
          );
        }

        return this.findOne(savedAccountItem.id);
      },
    );
  }

  async findPage(
    queryParams?: QueryAccountItemDto & { page?: number; pageSize?: number },
  ) {
    // 使用 QueryBuilder 构建查询
    const queryBuilder = this.accountItemRepository
      .createQueryBuilder('item')
      .select([
        ...AccountItemService.ALL_COLUMNS,
        'category.name as category',
        'shop.name as shop',
        'fund.name as fund',
      ])
      .leftJoin(
        'account_categories',
        'category',
        'category.code = item.category_code',
      )
      .leftJoin('account_shops', 'shop', 'shop.shop_code = item.shop_code')
      .leftJoin('account_funds', 'fund', 'fund.id = item.fund_id')
      .where('item.account_book_id = :accountBookId', {
        accountBookId: queryParams.accountBookId,
      });

    // 添加筛选条件
    if (queryParams) {
      if (queryParams.accountBookId) {
        queryBuilder.andWhere('item.account_book_id = :accountBookId', {
          accountBookId: queryParams.accountBookId,
        });
      }

      // 分类筛选
      if (
        Array.isArray(queryParams.categories) &&
        queryParams.categories.length > 0
      ) {
        queryBuilder.andWhere('category.name IN (:...categories)', {
          categories: queryParams.categories,
        });
      }
      if (queryParams.category) {
        queryBuilder.andWhere('category.name = :category', {
          category: queryParams.category,
        });
      }

      // 资产筛选
      if (
        Array.isArray(queryParams.fundIds) &&
        queryParams.fundIds.length > 0
      ) {
        queryBuilder.andWhere('item.fund_id IN (:...fundIds)', {
          fundIds: queryParams.fundIds,
        });
      }
      if (queryParams.fundId) {
        queryBuilder.andWhere('item.fund_id = :fundId', {
          fundId: queryParams.fundId,
        });
      }

      // 商家筛选
      if (
        Array.isArray(queryParams.shopCodes) &&
        queryParams.shopCodes.length > 0
      ) {
        queryBuilder.andWhere('item.shop_code IN (:...shopCodes)', {
          shopCodes: queryParams.shopCodes,
        });
      }
      if (queryParams.shopCode) {
        queryBuilder.andWhere('item.shop_code = :shopCode', {
          shopCode: queryParams.shopCode,
        });
      }

      // 日期筛选
      if (queryParams.startDate) {
        queryBuilder.andWhere('item.account_date >= :startDate', {
          startDate: queryParams.startDate,
        });
      }

      if (queryParams.endDate) {
        queryBuilder.andWhere('item.account_date <= :endDate', {
          endDate: queryParams.endDate,
        });
      }

      // 类型筛选
      if (queryParams.type) {
        queryBuilder.andWhere('item.type = :type', {
          type: queryParams.type,
        });
      }

      // 金额范围筛选
      if (queryParams.minAmount !== undefined) {
        queryBuilder.andWhere('item.amount >= :minAmount', {
          minAmount: queryParams.minAmount,
        });
      }

      if (queryParams.maxAmount !== undefined) {
        queryBuilder.andWhere('item.amount <= :maxAmount', {
          maxAmount: queryParams.maxAmount,
        });
      }
    }

    // 克隆查询构建器用于统计总金额
    const summaryQueryBuilder = queryBuilder.clone();

    // 获取总记录数和分页数据
    const total = await queryBuilder.getCount();

    // 添加分页
    const page = queryParams?.page || 1;
    const pageSize = queryParams?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    // 只对分页数据添加排序和分页限制
    queryBuilder
      .orderBy('item.account_date', 'DESC')
      .addOrderBy('item.created_at', 'DESC')
      .offset(skip)
      .limit(pageSize);

    const [accountItems, summaryItems] = await Promise.all([
      queryBuilder.getRawMany(),
      summaryQueryBuilder.getRawMany(),
    ]);

    // 计算所有符合条件的记录的总收入和总支出
    const summary = summaryItems.reduce(
      (acc, item) => {
        const amount = Number(item.amount);
        if (item.type === ItemType.INCOME) {
          acc.allIn += amount;
        } else if (item.type === ItemType.EXPENSE) {
          acc.allOut += amount;
        }
        return acc;
      },
      { allIn: 0, allOut: 0 },
    );

    // 计算结余
    const allBalance = summary.allIn - summary.allOut;

    // 计算总页数
    const totalPage = Math.ceil(total / pageSize);

    return {
      items: accountItems.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
      summary: {
        allIn: Number(summary.allIn.toFixed(2)),
        allOut: Number(summary.allOut.toFixed(2)),
        allBalance: Number(allBalance.toFixed(2)),
      },
      pagination: {
        isLastPage: page === totalPage,
        total,
        totalPage,
        current: page,
        pageSize,
      },
    };
  }

  async findOne(id: string) {
    const accountItem = await this.accountItemRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect(
        Category,
        'category',
        'item.categoryCode = category.code',
      )
      .leftJoinAndSelect(
        'account_shops',
        'shop',
        'item.shopCode = shop.shopCode',
      )
      .select([
        ...AccountItemService.ALL_COLUMNS,
        'category.name as category',
        'shop.name as shop',
        'shop.shopCode as shopCode',
      ])
      .where('item.id = :id', { id })
      .getRawOne();

    if (!accountItem) {
      throw new Error('记账条目不存在');
    }

    return {
      ...accountItem,
      amount: Number(accountItem.amount),
    };
  }

  async update(
    id: string,
    updateAccountItemDto: UpdateAccountItemDto,
    userId: string,
  ) {
    console.log('updateAccountItemDto', updateAccountItemDto);
    const accountItem = await this.accountItemRepository.findOneBy({ id });
    if (!accountItem) {
      throw new NotFoundException('记账条目不存在');
    }

    // 如果更新了账户或类型，需要重新校验权限
    if (updateAccountItemDto.fundId || updateAccountItemDto.type) {
      await this.validateBookFundPermission(
        accountItem.accountBookId,
        updateAccountItemDto.fundId || accountItem.fundId,
        updateAccountItemDto.type || accountItem.type,
      );
    }

    // 如果更新了分类，需要处理分类逻辑
    if (updateAccountItemDto.category) {
      const category = await this.getOrCreateCategory(
        updateAccountItemDto.category,
        accountItem.type,
        accountItem.accountBookId,
        userId,
      );
      accountItem.categoryCode = category.code;
    }

    // 处理商家信息
    if (updateAccountItemDto.shop !== undefined) {
      if (updateAccountItemDto.shop) {
        const shop = await this.accountShopService.getOrCreateShop(
          updateAccountItemDto.shop,
          accountItem.accountBookId,
          userId,
        );
        accountItem.shopCode = shop.shopCode;
      } else {
        accountItem.shopCode = null;
      }
    }

    Object.assign(accountItem, {
      ...updateAccountItemDto,
      shopCode: accountItem.shopCode,
      updatedBy: userId,
    });

    return this.accountItemRepository.save(accountItem);
  }

  async remove(id: string) {
    const accountItem = await this.accountItemRepository.findOneBy({ id });
    if (!accountItem) {
      throw new Error('记账条目不存在');
    }
    return this.accountItemRepository.remove(accountItem);
  }

  async createBatch(
    createAccountItemDtos: CreateAccountItemDto[],
    userId: string,
  ) {
    let successCount = 0;
    const errors = [];

    // 使用事务处理批量创建
    await this.accountItemRepository.manager.transaction(
      async (transactionalEntityManager) => {
        for (const dto of createAccountItemDtos) {
          try {
            // 校验账本是否存在
            const accountBook = await transactionalEntityManager.findOneBy(
              AccountBook,
              {
                id: dto.accountBookId,
              },
            );
            if (!accountBook) {
              errors.push(`账本ID ${dto.accountBookId} 不存在`);
              continue;
            }

            // 校验账本资产权限
            await this.validateBookFundPermission(
              dto.accountBookId,
              dto.fundId,
              dto.type,
            );

            // 处理分类
            const category = await this.getOrCreateCategory(
              dto.category,
              dto.type,
              dto.accountBookId,
              userId,
            );

            // 处理商家信息
            let shopCode = null;
            if (dto.shop) {
              const shop = await this.accountShopService.getOrCreateShop(
                dto.shop,
                dto.accountBookId,
                userId,
              );
              shopCode = shop.shopCode;
            }

            // 创建账目
            const accountItem = transactionalEntityManager.create(AccountItem, {
              ...dto,
              shopCode,
              categoryCode: category.code,
              createdBy: userId,
              updatedBy: userId,
            });

            await transactionalEntityManager.save(AccountItem, accountItem);

            // 更新分类的最近账目时间
            await transactionalEntityManager.update(
              Category,
              { code: category.code },
              { lastAccountItemAt: accountItem.createdAt },
            );

            successCount++;
          } catch (error) {
            errors.push(error.message);
          }
        }
      },
    );

    return {
      successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async batchDelete(
    ids: string[],
    userId: string,
  ): Promise<{ successCount: number; errors?: string[] }> {
    let successCount = 0;
    const errors = [];

    // 使用事务处理批量删除
    await this.accountItemRepository.manager.transaction(
      async (transactionalEntityManager) => {
        for (const id of ids) {
          try {
            // 查找账目记录
            const accountItem = await transactionalEntityManager.findOne(
              AccountItem,
              {
                where: { id },
              },
            );

            if (!accountItem) {
              errors.push(`账目ID ${id} 不存在`);
              continue;
            }

            // 检查删除权限
            const accountUser = await transactionalEntityManager.findOne(
              AccountBookUser,
              {
                where: {
                  accountBookId: accountItem.accountBookId,
                  userId,
                  canDeleteBook: true,
                },
              },
            );

            if (!accountUser) {
              errors.push(`没有权限删除账目ID ${id}`);
              continue;
            }

            // 删除账目
            await transactionalEntityManager.remove(accountItem);
            successCount++;
          } catch (error) {
            errors.push(`删除账目ID ${id} 失败: ${error.message}`);
          }
        }
      },
    );

    return {
      successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
