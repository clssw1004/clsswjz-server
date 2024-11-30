import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountFund } from '../pojo/entities/account-fund.entity';
import { AccountBookFund } from '../pojo/entities/account-book-fund.entity';
import { CreateAccountFundDto } from '../pojo/dto/account-fund/create-account-fund.dto';
import { QueryAccountFundDto } from '../pojo/dto/account-fund/query-account-fund.dto';
import { Like } from 'typeorm';

@Injectable()
export class AccountFundService {
  constructor(
    @InjectRepository(AccountFund)
    private accountFundRepository: Repository<AccountFund>,
    @InjectRepository(AccountBookFund)
    private accountBookFundRepository: Repository<AccountBookFund>,
  ) {}

  async create(
    createFundDto: CreateAccountFundDto, 
    userId: string
  ): Promise<AccountFund> {
    const { accountBookId, ...fundData } = createFundDto;

    // 检查该账本下是否已有资产关联
    const existingBookFund = await this.accountBookFundRepository.findOne({
      where: { accountBookId }
    });

    const fund = this.accountFundRepository.create({
      ...fundData,
      isDefault: !existingBookFund,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedFund = await this.accountFundRepository.save(fund);

    // 创建账本与资产的关联关系
    const bookFund = this.accountBookFundRepository.create({
      accountBookId,
      fundId: savedFund.id,
      fundIn: true,
      fundOut: true,
    });
    await this.accountBookFundRepository.save(bookFund);

    return savedFund;
  }

  async findByAccountBookId(userId: string, query: QueryAccountFundDto): Promise<AccountFund[]> {
    const queryBuilder = this.accountFundRepository
      .createQueryBuilder('fund')
      .select([
        'fund.*',
        'abf.fundIn as fundIn',
        'abf.fundOut as fundOut'
      ])
      .innerJoin('rel_accountbook_funds', 'abf', 'abf.fundId = fund.id')
      .where('abf.accountBookId = :accountBookId', { 
        accountBookId: query.accountBookId 
      });

    if (query.fundName) {
      queryBuilder.andWhere('fund.fundName LIKE :fundName', { 
        fundName: `%${query.fundName}%` 
      });
    }

    const results = await queryBuilder
      .orderBy('fund.isDefault', 'DESC')
      .addOrderBy('fund.createdAt', 'DESC')
      .getRawMany();

    return results.map(item => ({
      ...item,
      fundIn: !!item.fundIn,
      fundOut: !!item.fundOut
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
    updateFundDto: Partial<AccountFund>,
    userId: string,
  ): Promise<AccountFund> {
    const fund = await this.findOne(id, userId);
    Object.assign(fund, {
      ...updateFundDto,
      updatedBy: userId,
    });
    return await this.accountFundRepository.save(fund);
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
} 