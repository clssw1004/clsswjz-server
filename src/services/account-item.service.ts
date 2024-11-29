import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { Category } from '../pojo/entities/category.entity';
import { CreateAccountItemDto } from '../pojo/dto/account-item/create-account-item.dto';
import { UpdateAccountItemDto } from '../pojo/dto/account-item/update-account-item.dto';
import * as shortid from 'shortid';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { NotFoundException } from '@nestjs/common';
import { QueryAccountItemDto } from '../pojo/dto/account-item/query-account-item.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountItem)
    private accountItemRepository: Repository<AccountItem>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
  ) { }

  /**
   * 获取或创建分类
   * @param categoryName 分类名称
   * @param accountBookId 账本ID
   * @param userId 用户ID
   * @returns 分类对象
   */
  private async getOrCreateCategory(
    categoryName: string,
    accountBookId: string,
    userId: string,
  ): Promise<Category> {
    let category = await this.categoryRepository.findOneBy({
      name: categoryName,
      accountBookId,
    });

    if (!category) {
      category = this.categoryRepository.create({
        code: shortid.generate(),
        name: categoryName,
        accountBookId,
        createdBy: userId,
        updatedBy: userId,
      });
      await this.categoryRepository.save(category);
    }
    return category;
  }

  async create(createAccountItemDto: CreateAccountItemDto, userId: string) {
    // 校验账本是否存在
    const accountBook = await this.accountBookRepository.findOneBy({
      id: createAccountItemDto.accountBookId,
    });
    if (!accountBook) {
      throw new NotFoundException(
        `账本ID ${createAccountItemDto.accountBookId} 不存在`,
      );
    }

    // 处理分类
    const category = await this.getOrCreateCategory(
      createAccountItemDto.category,
      createAccountItemDto.accountBookId,
      userId,
    );

    // 创建账目
    const accountItem = this.accountItemRepository.create({
      ...createAccountItemDto,
      categoryCode: category.code,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedAccountItem = await this.accountItemRepository.save(accountItem);

    // 更新分类的最近账目时间
    await this.categoryRepository.update(
      { code: category.id },
      { lastAccountItemAt: savedAccountItem.createdAt }
    );

    return savedAccountItem;
  }

  async findAll(queryParams?: QueryAccountItemDto) {
    // 使用 QueryBuilder 构建查询
    const queryBuilder = this.accountItemRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect(
        Category,
        'category',
        'account.categoryCode = category.code',
      )
      .select(['account.*', 'category.name as category']);

    // 添加筛选条件
    if (queryParams) {
      if (queryParams.accountBookId) {
        queryBuilder.andWhere('account.accountBookId = :accountBookId', {
          accountBookId: queryParams.accountBookId,
        });
      }

      if (queryParams.category) {
        queryBuilder.andWhere('category.name = :category', {
          category: queryParams.category,
        });
      }

      if (queryParams.startDate) {
        queryBuilder.andWhere('account.accountDate >= :startDate', {
          startDate: queryParams.startDate,
        });
      }

      if (queryParams.endDate) {
        queryBuilder.andWhere('account.accountDate <= :endDate', {
          endDate: queryParams.endDate,
        });
      }

      if (queryParams.type) {
        queryBuilder.andWhere('account.type = :type', {
          type: queryParams.type,
        });
      }
    }

    // 添加排序
    queryBuilder
      .orderBy('account.accountDate', 'DESC')
      .addOrderBy('account.createdAt', 'DESC');

    const accountItems = await queryBuilder.getRawMany();

    return accountItems.map((item) => ({
      ...item,
    }));
  }

  async findOne(id: string) {
    const accountItem = await this.accountItemRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect(
        Category,
        'category',
        'account.categoryCode = category.code',
      )
      .select(['account.*', 'category.name as category'])
      .where('account.id = :id', { id })
      .getRawOne();

    if (!accountItem) {
      throw new Error('记账条目不存在');
    }

    return {
      ...accountItem,
    };
  }

  async update(
    id: string,
    updateAccountItemDto: UpdateAccountItemDto,
    userId: string,
  ) {
    const accountItem = await this.accountItemRepository.findOneBy({ id });
    if (!accountItem) {
      throw new Error('记账条目不存在');
    }

    // 如果更新了分类，需要处理分类逻辑
    if (updateAccountItemDto.category) {
      const category = await this.getOrCreateCategory(
        updateAccountItemDto.category,
        accountItem.accountBookId,
        userId,
      );
      accountItem.categoryCode = category.code;
    }

    Object.assign(accountItem, {
      ...updateAccountItemDto,
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
}
