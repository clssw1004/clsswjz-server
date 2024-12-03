import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { Category } from '../pojo/entities/category.entity';
import { DEFAULT_CATEGORIES } from '../config/default-categories.config';
import { UpdateAccountBookDto } from '../pojo/dto/account-book/update-account-book.dto';
import { CreateAccountBookDto } from '../pojo/dto/account-book/create-account-book.dto';
import { generateUid } from '../utils/id.util';

@Injectable()
export class AccountBookService {
  constructor(
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountBookUser)
    private accountUserRepository: Repository<AccountBookUser>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  // 创建默认分类
  private async createDefaultCategories(
    accountBookId: string,
    userId: string,
  ): Promise<void> {
    const categories = DEFAULT_CATEGORIES.map((category) => ({
      name: category.name,
      accountBookId: accountBookId,
      code: generateUid(),
      createdBy: userId,
      updatedBy: userId,
    }));

    await this.categoryRepository.save(categories);
  }

  /**
   * 检查账本名称是否已存在
   */
  private async checkNameExists(
    name: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.accountBookRepository.count({
      where: {
        name,
        createdBy: userId,
      },
    });
    return count > 0;
  }

  async create(
    createAccountBookDto: CreateAccountBookDto,
    userId: string,
  ): Promise<AccountBook> {
    // 检查账本名称是否已存在
    const nameExists = await this.checkNameExists(
      createAccountBookDto.name,
      userId,
    );
    if (nameExists) {
      throw new ConflictException('账本名称已存在');
    }

    // 创建账本
    const accountBook = this.accountBookRepository.create({
      ...createAccountBookDto,
      createdBy: userId,
      updatedBy: userId,
    });
    const savedAccountBook = await this.accountBookRepository.save(accountBook);

    // 创建账本用户关联
    const accountBookUser = this.accountUserRepository.create({
      accountBookId: savedAccountBook.id,
      userId: userId,
      canViewBook: true,
      canEditBook: true,
      canDeleteBook: true,
      canViewItem: true,
      canEditItem: true,
      canDeleteItem: true,
    });
    await this.accountUserRepository.save(accountBookUser);

    // 创建默认分类
    await this.createDefaultCategories(savedAccountBook.id, userId);

    return savedAccountBook;
  }

  /**
   * 获取账本详细信息（包含权限和成员信息）
   */
  private async getAccountBookDetail(accountBook: any, userId: string) {
    // 查询当前用户的权限信息（如果不是创建者）
    let currentUserPermissions = {
      canViewBook: true,
      canEditBook: true,
      canDeleteBook: true,
      canViewItem: true,
      canEditItem: true,
      canDeleteItem: true,
    };

    if (accountBook.createdBy !== userId) {
      const currentUserMember = await this.accountUserRepository
        .createQueryBuilder('abu')
        .where('abu.accountBookId = :accountBookId', {
          accountBookId: accountBook.id,
        })
        .andWhere('abu.userId = :userId', { userId })
        .getOne();

      if (currentUserMember) {
        currentUserPermissions = {
          canViewBook: currentUserMember.canViewBook,
          canEditBook: currentUserMember.canEditBook,
          canDeleteBook: currentUserMember.canDeleteBook,
          canViewItem: currentUserMember.canViewItem,
          canEditItem: currentUserMember.canEditItem,
          canDeleteItem: currentUserMember.canDeleteItem,
        };
      }
    }

    // 查询其他成员信息（不包括创建者）
    const members = await this.accountUserRepository
      .createQueryBuilder('abu')
      .select([
        'abu.userId as userId',
        'abu.canViewBook as canViewBook',
        'abu.canEditBook as canEditBook',
        'abu.canDeleteBook as canDeleteBook',
        'abu.canViewItem as canViewItem',
        'abu.canEditItem as canEditItem',
        'abu.canDeleteItem as canDeleteItem',
        'u.nickname as nickname',
      ])
      .leftJoin('users', 'u', 'u.id = abu.userId')
      .where('abu.accountBookId = :accountBookId', {
        accountBookId: accountBook.id,
      })
      .andWhere('abu.userId != :createdBy', { createdBy: accountBook.createdBy })
      .getRawMany();

    return {
      id: accountBook.id,
      name: accountBook.name,
      description: accountBook.description,
      currencySymbol: accountBook.currencySymbol,
      icon: accountBook.icon,
      createdAt: accountBook.createdAt,
      updatedAt: accountBook.updatedAt,
      createdBy: accountBook.createdBy,
      updatedBy: accountBook.updatedBy,
      fromId: accountBook.fromId,
      fromName: accountBook.fromName,
      permissions: currentUserPermissions,
      members: members.map((member) => ({
        userId: member.userId,
        nickname: member.nickname,
        canViewBook: !!member.canViewBook,
        canEditBook: !!member.canEditBook,
        canDeleteBook: !!member.canDeleteBook,
        canViewItem: !!member.canViewItem,
        canEditItem: !!member.canEditItem,
        canDeleteItem: !!member.canDeleteItem,
      })),
    };
  }

  async findAll(userId: string): Promise<any[]> {
    const queryBuilder = this.accountBookRepository
      .createQueryBuilder('book')
      .select([
        'book.*',
        'abu.canViewBook as canViewBook',
        'abu.canEditBook as canEditBook',
        'abu.canDeleteBook as canDeleteBook',
        'abu.canViewItem as canViewItem',
        'abu.canEditItem as canEditItem',
        'abu.canDeleteItem as canDeleteItem',
        'creator.id as fromId',
        'creator.nickname as fromName',
      ])
      .innerJoin('rel_accountbook_user', 'abu', 'abu.accountBookId = book.id')
      .innerJoin('users', 'creator', 'creator.id = book.createdBy')
      .where('abu.userId = :userId', { userId })
      .andWhere('abu.canViewBook = :canView', { canView: true });

    const results = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .getRawMany();

    return Promise.all(
      results.map((item) => this.getAccountBookDetail(item, userId)),
    );
  }

  async findOne(id: string, userId: string): Promise<any> {
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

    // 查询账本基本信息和当前用户权限
    const accountBook = await this.accountBookRepository
      .createQueryBuilder('book')
      .select([
        'book.*',
        'abu.canViewBook as canViewBook',
        'abu.canEditBook as canEditBook',
        'abu.canDeleteBook as canDeleteBook',
        'abu.canViewItem as canViewItem',
        'abu.canEditItem as canEditItem',
        'abu.canDeleteItem as canDeleteItem',
        'creator.id as fromId',
        'creator.nickname as fromName',
      ])
      .innerJoin('rel_accountbook_user', 'abu', 'abu.accountBookId = book.id')
      .innerJoin('users', 'creator', 'creator.id = book.createdBy')
      .where('book.id = :id', { id })
      .andWhere('abu.userId = :userId', { userId })
      .getRawOne();

    if (!accountBook) {
      throw new NotFoundException('账本不存在');
    }

    return this.getAccountBookDetail(accountBook, userId);
  }

  async update(updateDto: UpdateAccountBookDto, userId: string): Promise<any> {
    // 检查用户是否有编辑权限
    const accountUser = await this.accountUserRepository.findOne({
      where: {
        accountBookId: updateDto.id,
        userId: userId,
        canEditBook: true,
      },
    });

    if (!accountUser) {
      throw new ForbiddenException('没有权限编辑该账本');
    }

    // 检查账本是否存在
    const accountBook = await this.accountBookRepository.findOne({
      where: { id: updateDto.id },
    });

    if (!accountBook) {
      throw new NotFoundException('账本不存在');
    }

    // 获取当前账本所有的成员关联信息
    const existingMembers = await this.accountUserRepository.find({
      where: { accountBookId: updateDto.id },
    });

    // 更新账本基本信息
    await this.accountBookRepository.update(updateDto.id, {
      name: updateDto.name,
      description: updateDto.description,
      currencySymbol: updateDto.currencySymbol,
      icon: updateDto.icon,
      updatedBy: userId,
    });

    // 处理成员信息
    const memberOperations = [];

    for (const existingMember of existingMembers) {
      // 跳过创建者的权限更新
      if (existingMember.userId === accountBook.createdBy) {
        continue;
      }

      const newMember = updateDto.members.find(
        (m) => m.userId === existingMember.userId,
      );

      if (newMember) {
        // 更新已存在的成员信息
        memberOperations.push(
          this.accountUserRepository.update(
            { accountBookId: updateDto.id, userId: existingMember.userId },
            {
              canViewBook: newMember.canViewBook,
              canEditBook: newMember.canEditBook,
              canDeleteBook: newMember.canDeleteBook,
              canViewItem: newMember.canViewItem,
              canEditItem: newMember.canEditItem,
              canDeleteItem: newMember.canDeleteItem,
            },
          ),
        );
      } else {
        // 删除不再存在的成员信息
        memberOperations.push(
          this.accountUserRepository.delete({
            accountBookId: updateDto.id,
            userId: existingMember.userId,
          }),
        );
      }
    }

    // 添加新成员
    const existingUserIds = existingMembers.map((m) => m.userId);
    const newMembers = updateDto.members.filter(
      (m) => !existingUserIds.includes(m.userId) && m.userId !== accountBook.createdBy,
    );

    for (const newMember of newMembers) {
      const newAccountBookUser = this.accountUserRepository.create({
        accountBookId: updateDto.id,
        userId: newMember.userId,
        canViewBook: newMember.canViewBook,
        canEditBook: newMember.canEditBook,
        canDeleteBook: newMember.canDeleteBook,
        canViewItem: newMember.canViewItem,
        canEditItem: newMember.canEditItem,
        canDeleteItem: newMember.canDeleteItem,
      });
      memberOperations.push(
        this.accountUserRepository.save(newAccountBookUser),
      );
    }

    // 执行所有成员操作
    await Promise.all(memberOperations);

    // 返回更新后的账本信息
    return this.findOne(updateDto.id, userId);
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
  async createItem(accountBookId: string, userId: string): Promise<any> {
    await this.checkPermission(accountBookId, userId, 'canEditItem');
    // 继续处理创建账目的逻辑
  }

  async updateItem(accountBookId: string, userId: string): Promise<any> {
    await this.checkPermission(accountBookId, userId, 'canEditItem');
    // 继续处理更新账目的逻辑
  }

  async deleteItem(accountBookId: string, userId: string): Promise<any> {
    await this.checkPermission(accountBookId, userId, 'canDeleteItem');
    // 继续处理删除账目的逻辑
  }
}
