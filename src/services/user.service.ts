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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userDataInitService: UserDataInitService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username: userData.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    if (!userData.nickname) {
      userData.nickname = `cljz_${generateUid()}`;
    }

    // 使用事务确保用户创建和数据初始化是原子操作
    return await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // ���建用户
        const user = this.userRepository.create(userData);
        const savedUser = await transactionalEntityManager.save(user);

        // 初始化用户数据
        await this.userDataInitService.initializeUserData(savedUser.id);

        return savedUser;
      },
    );
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

    // 返回更新后的用户信��
    return this.getCurrentUser(userId);
  }
}
