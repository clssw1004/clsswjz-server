import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUsers } from '../pojo/entities/accountbook-user.entity';

@Injectable()
export class AccountBookService {
  constructor(
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountBookUsers)
    private accountUserRepository: Repository<AccountBookUsers>,
  ) {}

  async create(
    createAccountBookDto: Partial<AccountBook>,
    userId: string,
  ): Promise<AccountBook> {
    // 创建账本
    const accountBook = this.accountBookRepository.create({
      ...createAccountBookDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedAccountBook = await this.accountBookRepository.save(accountBook);

    // 创建账本用户关联，创建者拥有所有权限
    await this.accountUserRepository.save({
      accountBookId: savedAccountBook.id,
      userId: userId,
      canViewBook: true,
      canEditBook: true,
      canDeleteBook: true,
      canViewItem: true,
      canEditItem: true,
      canDeleteItem: true,
    });

    return savedAccountBook;
  }

  async findAll(userId: string): Promise<AccountBook[]> {
    // 先查询用户有权限的账本ID
    const accountUsers = await this.accountUserRepository.find({
      where: {
        userId,
        canViewBook: true,
      },
      select: ['accountBookId'],
    });

    const bookIds = accountUsers.map((au) => au.accountBookId);

    // 再查询账本详情
    return this.accountBookRepository.find({
      where: {
        id: In(bookIds),
      },
    });
  }

  async findOne(id: string, userId: string): Promise<AccountBook> {
    // 检查用户是否有权限查看该账本
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountBookId: id,
        userId: userId,
        canViewBook: true,
      },
    });

    if (!accountUser) {
      throw new ForbiddenException('没有权限查看该账本');
    }

    const accountBook = await this.accountBookRepository.findOne({
      where: { id },
    });

    if (!accountBook) {
      throw new NotFoundException('账本不存在');
    }

    return accountBook;
  }

  async update(
    id: string,
    updateAccountBookDto: Partial<AccountBook>,
    userId: string,
  ): Promise<AccountBook> {
    // 检查用户是否有编辑权限
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountBookId: id,
        userId: userId,
        canEditBook: true,
      },
    });

    if (!accountUser) {
      throw new ForbiddenException('没有权限编辑该账本');
    }

    await this.accountBookRepository.update(id, {
      ...updateAccountBookDto,
      updatedBy: userId,
    });

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    // 检查用户是否有删除权限
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountBookId: id,
        userId: userId,
        canDeleteBook: true,
      },
    });

    if (!accountUser) {
      throw new ForbiddenException('没有权限删除该账本');
    }
    await this.accountBookRepository.delete(id);
  }

  // 添加通用的权限检查方法
  private async checkPermission(
    accountBookId: string,
    userId: string,
    permissionType: 'canViewItem' | 'canEditItem' | 'canDeleteItem',
  ): Promise<void> {
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountBookId,
        userId,
        [permissionType]: true,
      },
    });

    if (!accountUser) {
      throw new ForbiddenException('没有权限执行此操作');
    }
  }

  // 在账目相关操作前调用权限检查，例如：
  async createItem(accountBookId: string, userId: string, ...other): Promise<any> {
    await this.checkPermission(accountBookId, userId, 'canEditItem');
    // 继续处理创建账目的逻辑
  }

  async updateItem(accountBookId: string, userId: string, ...other): Promise<any> {
    await this.checkPermission(accountBookId, userId, 'canEditItem');
    // 继续处理更新账目的逻辑
  }

  async deleteItem(accountBookId: string, userId: string, ...other): Promise<any> {
    await this.checkPermission(accountBookId, userId, 'canDeleteItem');
    // 继续处理删除账目的逻辑
  }
}
