import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBookFund } from '../pojo/entities/account-book-fund.entity';
import { CreateAccountFundDto } from '../pojo/dto/account-fund/create-account-fund.dto';
import { QueryAccountFundDto } from '../pojo/dto/account-fund/query-account-fund.dto';
import {
  UpdateAccountFundDto,
  FundBookDto,
} from '../pojo/dto/account-fund/update-account-fund.dto';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';

@Injectable()
export class AccountFundService {
  constructor(
    @InjectRepository(AccountFund)
    private accountFundRepository: Repository<AccountFund>,
    @InjectRepository(AccountBookFund)
    private accountBookFundRepository: Repository<AccountBookFund>,
    @InjectRepository(AccountBookUser)
    private accountBookUserRepository: Repository<AccountBookUser>,
  ) {}

  static readonly FUND_COLUMNS = [
    'fund.id as id',
    'fund.name as name', 
    'fund.fund_type as fundType',
    'fund.fund_balance as fundBalance',
    'fund.fund_remark as fundRemark',
    'fund.created_at as createdAt',
    'fund.updated_at as updatedAt',
    'fund.created_by as createdBy',
    'fund.updated_by as updatedBy'
  ];
  /**
   * 设置账本的默认账户
   */
  private async setAccountBookDefaultFund(
    accountBookId: string,
    fundId: string,
    isDefault: boolean,
  ): Promise<void> {
    if (isDefault) {
      // 先将该账本下所有账户的 isDefault 设为 false
      await this.accountBookFundRepository.update(
        { accountBookId },
        { isDefault: false },
      );
    }
    // 再设置指定账户的 isDefault
    await this.accountBookFundRepository.update(
      { accountBookId, fundId },
      { isDefault },
    );
  }

  async create(
    createFundDto: CreateAccountFundDto,
    userId: string,
  ): Promise<AccountFund> {
    // 检查账户名称是否已存在
    const existingFund = await this.accountFundRepository.findOne({
      where: {
        name: createFundDto.name,
        createdBy: userId,
      },
    });

    if (existingFund) {
      throw new Error('账户名称已存在');
    }

    const fund = this.accountFundRepository.create({
      ...createFundDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.accountFundRepository.save(fund);
  }

  async findByAccountBookId(
    userId: string,
    query: QueryAccountFundDto,
  ): Promise<AccountFund[]> {
    const queryBuilder = this.accountFundRepository
      .createQueryBuilder('fund')
      .select([
        ...AccountFundService.FUND_COLUMNS,
        'abf.fund_in as fundIn',
        'abf.fund_out as fundOut',
        'abf.is_default as isDefault',
        'book.name as accountBookName',
      ])
      .innerJoin('rel_accountbook_funds', 'abf', 'abf.fund_id = fund.id')
      .leftJoin('account_books', 'book', 'book.id = abf.account_book_id')
      .where('abf.account_book_id = :accountBookId', {
        accountBookId: query.accountBookId,
      });

    if (query.name) {
      queryBuilder.andWhere('fund.name LIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const results = await queryBuilder
      .orderBy('abf.isDefault', 'DESC')
      .addOrderBy('fund.createdAt', 'DESC')
      .getRawMany();

    return results.map((item) => ({
      ...item,
      fundIn: !!item.fundIn,
      fundOut: !!item.fundOut,
      isDefault: !!item.isDefault,
      accountBookName: item.accountBookName,
      fundBalance: Number(item.fundBalance),
    }));
  }

  async findOne(id: string, userId: string): Promise<AccountFund> {
    const fund = await this.accountFundRepository.findOne({
      where: { id, createdBy: userId },
    });
    if (!fund) {
      throw new NotFoundException('资金账户不存在');
    }
    return fund;
  }

  async update(
    id: string,
    updateDto: UpdateAccountFundDto,
    userId: string,
  ): Promise<AccountFund> {
    const fund = await this.findOne(id, userId);

    // 如果要更新名称，检查新名称是否已存在
    if (updateDto.name && updateDto.name !== fund.name) {
      const existingFund = await this.accountFundRepository.findOne({
        where: {
          name: updateDto.name,
          createdBy: userId,
          id: Not(id), // 排除当前记录
        },
      });

      if (existingFund) {
        throw new Error('账户名称已存在');
      }
    }

    // 1. 更新资产基本信息
    const { fundBooks, ...fundData } = updateDto;

    // 更新基本信息
    Object.assign(fund, {
      ...fundData,
      updatedBy: userId,
    });
    await this.accountFundRepository.save(fund);

    // 2. 处理账本关联关系
    if (fundBooks) {
      await this.updateFundBooks(id, fundBooks);
    }

    // 3. 返回更新后的完整信息
    return this.getAccountFundWithBooks(id);
  }

  /**
   * 更新资产与账本的关联关系
   */
  private async updateFundBooks(
    fundId: string,
    fundBooks: FundBookDto[],
  ): Promise<void> {
    // 获取所有现有的关联关系
    const existingRelations = await this.accountBookFundRepository.find({
      where: { fundId },
    });

    // 获取所有需要更新的账本ID
    const updateBookIds = fundBooks.map((book) => book.accountBookId);

    // 找出需要删除的关联关系（存在于数据库但不在更新列表中的）
    const deleteRelations = existingRelations.filter(
      (relation) => !updateBookIds.includes(relation.accountBookId),
    );

    // 删除不再需要的关联关系
    if (deleteRelations.length > 0) {
      await this.accountBookFundRepository.remove(deleteRelations);
    }

    // 更新或创建关联关系
    for (const bookData of fundBooks) {
      const existingRelation = existingRelations.find(
        (relation) => relation.accountBookId === bookData.accountBookId,
      );

      if (existingRelation) {
        // 如果要设置为默认账户，需要先取消其他账户的默认状态
        if (bookData.isDefault && !existingRelation.isDefault) {
          await this.setAccountBookDefaultFund(
            bookData.accountBookId,
            fundId,
            true,
          );
        }
        // 更新已存在的关联关系
        await this.accountBookFundRepository.update(
          {
            accountBookId: bookData.accountBookId,
            fundId,
          },
          {
            fundIn: bookData.fundIn,
            fundOut: bookData.fundOut,
            isDefault: bookData.isDefault,
          },
        );
      } else {
        // 如果要设置为默认账户，需要先取消其他账户的默认状态
        if (bookData.isDefault) {
          await this.setAccountBookDefaultFund(
            bookData.accountBookId,
            fundId,
            true,
          );
        }
        // 创建新的关联关系
        const newRelation = this.accountBookFundRepository.create({
          accountBookId: bookData.accountBookId,
          fundId,
          fundIn: bookData.fundIn,
          fundOut: bookData.fundOut,
          isDefault: bookData.isDefault,
        });
        await this.accountBookFundRepository.save(newRelation);
      }
    }
  }

  /**
   * 获取资金账户及其关联的账本信息
   */
  private async getAccountFundWithBooks(id: string): Promise<any> {
    const fund = await this.accountFundRepository
      .createQueryBuilder('fund')
      .select([
        ...AccountFundService.FUND_COLUMNS,
        'abf.accountBookId',
        'abf.fundIn',
        'abf.fundOut',
        'abf.isDefault',
        'book.name as accountBookName',
      ])
      .leftJoin('rel_accountbook_funds', 'abf', 'abf.fundId = fund.id')
      .leftJoin('account_books', 'book', 'book.id = abf.accountBookId')
      .where('fund.id = :id', { id })
      .getRawOne();

    return {
      ...fund,
      fundBalance: Number(fund.fundBalance),
      fundBooks: fund.accountBookId
        ? [
            {
              accountBookId: fund.accountBookId,
              accountBookName: fund.accountBookName,
              fundIn: fund.fundIn,
              fundOut: fund.fundOut,
              isDefault: fund.isDefault,
            },
          ]
        : [],
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const fund = await this.findOne(id, userId);
    // 检查是否有关联的账本
    const hasBookRelation = await this.accountBookFundRepository.findOne({
      where: { fundId: id },
    });
    if (hasBookRelation) {
      throw new Error('该资金账户已关联账本，无法删除');
    }
    await this.accountFundRepository.remove(fund);
  }

  async updateBalance(
    id: string,
    amount: number,
    userId: string,
  ): Promise<AccountFund> {
    const fund = await this.findOne(id, userId);
    fund.fundBalance = Number(fund.fundBalance) + Number(amount);
    fund.updatedBy = userId;
    return await this.accountFundRepository.save(fund);
  }

  async findAll(userId: string): Promise<any[]> {
    // 先获取所有资金账户
    const funds = await this.accountFundRepository
      .createQueryBuilder('fund')
      .select([
        ...AccountFundService.FUND_COLUMNS,
        'creator.nickname as creatorName', // 创建人名称
      ])
      .leftJoin('users', 'creator', 'creator.id = fund.created_by')
      .where('fund.created_by = :userId', { userId })
      .orderBy('fund.created_at', 'DESC')
      .getRawMany();

    // 获取用户有权限的所有账本
    const userBooks = await this.accountBookUserRepository
      .createQueryBuilder('abu')
      .select([
        'abu.account_book_id as accountBookId',
        'book.name as accountBookName',
        'book.icon as accountBookIcon',
      ])
      .leftJoin('account_books', 'book', 'book.id = abu.account_book_id')
      .where('abu.user_id = :userId', { userId })
      .andWhere('abu.can_view_book = :canView', { canView: true })
      .getRawMany();

    // 获取所有资金账户的关联账本信息
    const fundBooks = await this.accountBookFundRepository
      .createQueryBuilder('abf')
      .select([
        'abf.fund_id as fundId',
        'abf.account_book_id as accountBookId',
        'abf.fund_in as fundIn',
        'abf.fund_out as fundOut',
        'abf.is_default as isDefault',
        'book.name as accountBookName',
        'book.icon as accountBookIcon',
      ])
      .leftJoin('account_books', 'book', 'book.id = abf.account_book_id')
      .where('abf.fund_id IN (:...fundIds)', {
        fundIds: funds.map((fund) => fund.id),
      })
      .getRawMany();

    // 将账本信息整理到对应的资金账户中
    return funds.map((fund) => {
      // 获取该资金账户的所有关联账本
      const existingBooks = fundBooks
        .filter((book) => book.fundId === fund.id)
        .reduce((acc, book) => {
          acc[book.accountBookId] = {
            accountBookId: book.accountBookId,
            accountBookName: book.accountBookName,
            accountBookIcon: book.accountBookIcon,
            fundIn: !!book.fundIn,
            fundOut: !!book.fundOut,
            isDefault: !!book.isDefault,
          };
          return acc;
        }, {});

      // 构建完整的账本列表，包括未关联的账本
      const books = userBooks
        .map((book) => ({
          accountBookId: book.accountBookId,
          accountBookName: book.accountBookName,
          accountBookIcon: book.accountBookIcon,
          ...(existingBooks[book.accountBookId] || {
            fundIn: false,
            fundOut: false,
            isDefault: false,
          }),
        }))
        .sort((a, b) => {
          // 默认账本排在最前面
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return 0;
        });

      return {
        ...fund,
        fundBalance: Number(fund.fundBalance),
        fundBooks: books,
      };
    });
  }

  /**
   * 关联账户到账本
   */
  async linkToBook(
    fundId: string,
    accountBookId: string,
    userId: string,
  ): Promise<void> {
    // 检查账户是否存在
    const fund = await this.accountFundRepository.findOne({
      where: { id: fundId },
    });
    if (!fund) {
      throw new NotFoundException('资金账户不存在');
    }

    // 检查是否已关联
    const existingRelation = await this.accountBookFundRepository.findOne({
      where: {
        fundId,
        accountBookId,
      },
    });

    if (!existingRelation) {
      // 创建新的关联关系
      const newRelation = this.accountBookFundRepository.create({
        accountBookId,
        fundId,
        fundIn: true,
        fundOut: true,
        isDefault: false,
      });
      await this.accountBookFundRepository.save(newRelation);
    }
  }
}
