import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
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
import { AccountItemPageVO } from '../pojo/vo/account-item/account-item-vo';
import { isEmpty } from 'lodash';
import { DEFAULT_SHOP } from 'src/config/default-shop.config';

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
          createAccountItemDto.attachments &&
          createAccountItemDto.attachments.length > 0
        ) {
          await this.attachmentService.createBatch(
            BusinessCode.ITEM,
            savedAccountItem.id,
            createAccountItemDto.attachments,
            userId,
          );
        }

        return this.findOne(savedAccountItem.id);
      },
    );
  }

  async findPage(
    queryParams?: QueryAccountItemDto & { page?: number; pageSize?: number },
  ): Promise<AccountItemPageVO> {
    const queryBuilder = this.accountItemRepository
      .createQueryBuilder('item')
      .select([
        ...AccountItemService.ALL_COLUMNS,
        'category.name as category',
        'shop.name as shop',
        'fund.name as fund',
        'creator.nickname as createdByName',
      ])
      .leftJoin(
        'account_categories',
        'category',
        'category.code = item.category_code',
      )
      .leftJoin('account_shops', 'shop', 'shop.shop_code = item.shop_code')
      .leftJoin('account_funds', 'fund', 'fund.id = item.fund_id')
      .leftJoin('users', 'creator', 'creator.id = item.created_by')
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

    // 获取所有账目的附件
    const itemIds = accountItems.map((item) => item.id);
    const attachments = await this.attachmentService.findByBusinessIds(itemIds);

    // 组装返回数据
    const items = accountItems.map((item) => ({
      ...item,
      amount: Number(item.amount),
      attachments: attachments.filter((att) => att.businessId === item.id),
      createdByName: item.createdByName,
    }));

    // 计算汇总信息
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
      items,
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
      .createQueryBuilder('item')
      .leftJoinAndSelect(
        Category,
        'category',
        'item.category_code = category.code',
      )
      .leftJoinAndSelect(
        'account_shops',
        'shop',
        'item.shop_code = item.shop_code',
      )
      .select([
        ...AccountItemService.ALL_COLUMNS,
        'category.name as category',
        'shop.name as shop',
        'shop.shop_code as shopCode',
      ])
      .where('item.id = :id', { id })
      .getRawOne();

    if (!accountItem) {
      throw new NotFoundException('记账条目不存在');
    }

    // 获取附件信息
    const attachments = await this.attachmentService.findByBusinessId(id);

    return {
      ...accountItem,
      amount: Number(accountItem.amount),
      attachments,
    };
  }

  async update(
    id: string,
    updateAccountItemDto: UpdateAccountItemDto,
    userId: string,
  ) {
    // 使用事务来确保账目和附件的更新是原子操作
    return await this.accountItemRepository.manager.transaction(
      async (transactionalEntityManager) => {
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
        const deleteAttachmentIds = [];

        // 删除指定的附件
        if (!isEmpty(updateAccountItemDto.deleteAttachmentId)) {
          deleteAttachmentIds.push(updateAccountItemDto.deleteAttachmentId);
        }
        // 删除指定的附件
        if (updateAccountItemDto.deleteAttachmentIds?.length > 0) {
          deleteAttachmentIds.push(...updateAccountItemDto.deleteAttachmentIds);
        }
        if (deleteAttachmentIds.length > 0) {
          await this.attachmentService.removeByIds(
            deleteAttachmentIds,
            transactionalEntityManager,
          );
        }

        // 添加新的附件
        if (updateAccountItemDto.attachments?.length > 0) {
          await this.attachmentService.createBatch(
            BusinessCode.ITEM,
            id,
            updateAccountItemDto.attachments,
            userId,
            transactionalEntityManager,
          );
        }

        // 更新账目基本信息
        Object.assign(accountItem, {
          ...updateAccountItemDto,
          shopCode: accountItem.shopCode,
          updatedBy: userId,
        });

        await transactionalEntityManager.save(accountItem);

        // 返回更新后的��整信息
        return this.findOne(id);
      },
    );
  }

  async remove(id: string) {
    // 使用事务来确保账目和附件的删除是原子操作
    return await this.accountItemRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const accountItem = await this.accountItemRepository.findOneBy({ id });
        if (!accountItem) {
          throw new NotFoundException('记账条目不存在');
        }

        // 删除关联的附件文件和记录
        await this.attachmentService.removeByIds(
          [id],
          transactionalEntityManager,
        );

        // 删除账目记录
        await transactionalEntityManager.remove(accountItem);

        return { success: true };
      },
    );
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
        // 预先获取所有涉及的账本
        const accountBookIds = [
          ...new Set(createAccountItemDtos.map((dto) => dto.accountBookId)),
        ];
        const accountBooks = await transactionalEntityManager.find(
          AccountBook,
          {
            where: { id: In(accountBookIds) },
          },
        );
        const accountBooksMap = new Map(
          accountBooks.map((book) => [book.id, book]),
        );

        // 预先获取或创建所有分类
        const categoryMap = new Map<string, Category>();
        for (const dto of createAccountItemDtos) {
          const key = `${dto.accountBookId}:${dto.category}:${dto.type}`;
          if (!categoryMap.has(key)) {
            const category = await this.getOrCreateCategory(
              dto.category,
              dto.type,
              dto.accountBookId,
              userId,
            );
            categoryMap.set(key, category);
          }
        }

        // 预先获取或创建所有商家
        const shopMap = new Map<string, string>();
        const uniqueShops = [
          ...new Set(
            createAccountItemDtos
              .filter((dto) => dto.shop)
              .map((dto) => `${dto.accountBookId}:${dto.shop}`),
          ),
        ];

        for (const shopKey of uniqueShops) {
          const [accountBookId, shopName] = shopKey.split(':');
          const shop = await this.accountShopService.getOrCreateShop(
            shopName,
            accountBookId,
            userId,
          );
          shopMap.set(shopKey, shop.shopCode);
        }

        // 批量创建账目
        const accountItems = transactionalEntityManager.create(
          AccountItem,
          createAccountItemDtos
            .map((dto) => {
              try {
                // 检查账本是否存在
                if (!accountBooksMap.has(dto.accountBookId)) {
                  throw new Error(`账本ID ${dto.accountBookId} 不存在`);
                }

                const categoryKey = `${dto.accountBookId}:${dto.category}:${dto.type}`;
                const category = categoryMap.get(categoryKey);
                if (!category) {
                  throw new Error(`分类 ${dto.category} 获取失败`);
                }

                const shopKey = dto.shop
                  ? `${dto.accountBookId}:${dto.shop}`
                  : null;
                const shopCode = shopKey ? shopMap.get(shopKey) : DEFAULT_SHOP;
                return {
                  ...dto,
                  shopCode,
                  fundId: dto.fundId || DEFAULT_FUND,
                  categoryCode: category.code,
                  createdBy: dto.createdBy || userId,
                  updatedBy: dto.createdBy || userId,
                };
              } catch (error) {
                errors.push(error.message);
                return null;
              }
            })
            .filter((item) => item !== null),
        );

        // 批量保存账目
        if (accountItems.length > 0) {
          const savedItems = await transactionalEntityManager.save(
            AccountItem,
            accountItems,
          );
          successCount = savedItems.length;

          // 批量更新分类的最近账目时间
          const categoryUpdates = {
            lastAccountItemAt: new Date(),
          };
          await transactionalEntityManager.update(
            Category,
            { code: In(Array.from(categoryMap.values()).map((c) => c.code)) },
            categoryUpdates,
          );
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
