import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../pojo/entities/user.entity';
import { UserDataInitService } from './user-data-init.service';
import { generateUid } from '../utils/id.util';
import { UpdateUserDto } from '../pojo/dto/user/update-user.dto';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { ItemType } from '../pojo/enums/item-type.enum';
import { LogSync } from 'src/pojo/entities/log-sync.entity';
import { OperateType } from 'src/pojo/enums/operate-type.enum';
import { SyncState } from 'src/pojo/enums/sync-state.enum';
import { BusinessType } from 'src/pojo/enums/business-type.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userDataInitService: UserDataInitService,
    @InjectRepository(AccountItem)
    private accountItemRepository: Repository<AccountItem>,
  ) {}

  async create(userData: Partial<User>): Promise<{ user: User; log: LogSync }> {
    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({
      where: { username: userData.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已被使用（忽略 null）
    if (userData.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: userData.email },
      });
      if (existingEmail) {
        throw new ConflictException('该邮箱已被使用');
      }
    }

    // 检查手机号是否已被使用（忽略 null）
    if (userData.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: userData.phone },
      });
      if (existingPhone) {
        throw new ConflictException('该手机号已被使用');
      }
    }

    if (!userData.nickname) {
      userData.nickname = `cljz_${generateUid()}`;
    }

    // 使用事务确保用户创建和数据初始化是原子操作
    return await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const user = this.userRepository.create(userData);
        const savedUser = await transactionalEntityManager.save(user);

        // 初始化用户数据
        // await this.userDataInitService.initializeUserData(savedUser.id);

        return { user: savedUser, log: this.generateUserLog(savedUser) };
      },
    );
  }

  generateUserLog(user: User): LogSync {
    return {
      id: user.id,
      operatorId: user.id,
      operatedAt: user.createdAt,
      businessType: BusinessType.USER,
      operateType: OperateType.CREATE,
      businessId: user.id,
      operateData: JSON.stringify(user),
      syncState: SyncState.SYNCED,
      syncTime: user.createdAt,
      syncError: null,
      parentType: BusinessType.ROOT,
      parentId: 'None',
    } as LogSync;
  }

  async findByInviteCode(
    inviteCode: string,
  ): Promise<Pick<User, 'id' | 'nickname'>> {
    const user = await this.userRepository.findOne({
      where: { inviteCode },
      select: ['id', 'nickname'],
    });

    if (!user) {
      throw new NotFoundException('未找到该邀请码对应的用户');
    }

    return user;
  }

  async resetInviteCode(userId: string): Promise<{ inviteCode: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const newInviteCode = `cljz_${generateUid(12)}`;

    await this.userRepository.update(
      { id: userId },
      { inviteCode: newInviteCode },
    );

    return { inviteCode: newInviteCode };
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'nickname',
        'email',
        'phone',
        'inviteCode',
        'language',
        'timezone',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 如果要更新邮箱，检查邮箱是否已被使用
    if (updateUserDto.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('该邮箱已被使用');
      }
    }

    // 如果要更新手机号，检查手机号是否已被使用
    if (updateUserDto.phone) {
      const existingUser = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('该手机号已被使用');
      }
    }

    // 更新用户信息
    await this.userRepository.update(userId, updateUserDto);

    // 返回更新后的用户信息
    return this.getCurrentUser(userId);
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId: string) {
    // 获取用户所有账目
    const itemsQuery = this.accountItemRepository
      .createQueryBuilder('item')
      .where('item.created_by = :userId', { userId });

    // 获取账目总数
    const totalItems = await itemsQuery.getCount();

    // 获取记账天数（不重复的账目日期数）
    const daysQuery = await this.accountItemRepository
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT DATE(item.account_date))', 'days')
      .where('item.created_by = :userId', { userId })
      .getRawOne();

    // 计算净资产（所有收入 - 所有支出）
    const assetsQuery = await this.accountItemRepository
      .createQueryBuilder('item')
      .select([
        'SUM(CASE WHEN item.type = :incomeType THEN item.amount ELSE 0 END) totalIncome',
        'SUM(CASE WHEN item.type = :expenseType THEN item.amount ELSE 0 END) totalExpense',
      ])
      .where('item.created_by = :userId', {
        userId,
        incomeType: ItemType.INCOME,
        expenseType: ItemType.EXPENSE,
      })
      .getRawOne();

    const totalIncome = Number(assetsQuery.totalIncome) || 0;
    const totalExpense = Number(assetsQuery.totalExpense) || 0;
    const totalFunds = totalIncome - totalExpense;

    return {
      totalItems, // 总记账笔数
      totalDays: Number(daysQuery.days) || 0, // 总记账天数
      totalFunds, // 净资产
    };
  }
}
