import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../pojo/entities/user.entity';
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
}
