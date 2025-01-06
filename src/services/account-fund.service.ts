import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { CreateAccountFundDto } from '../pojo/dto/account-fund/create-account-fund.dto';
import { QueryAccountFundDto } from '../pojo/dto/account-fund/query-account-fund.dto';
import { UpdateAccountFundDto } from '../pojo/dto/account-fund/update-account-fund.dto';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';

@Injectable()
export class AccountFundService {
  constructor(
    @InjectRepository(AccountFund)
    private accountFundRepository: Repository<AccountFund>,
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
    'fund.updated_by as updatedBy',
  ];

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
    const { ...fundData } = updateDto;

    // 更新基本信息
    Object.assign(fund, {
      ...fundData,
      updatedBy: userId,
    });
    await this.accountFundRepository.save(fund);

    // 3. 返回更新后的完整信息
    return this.getAccountFundWithBooks(id);
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
}
