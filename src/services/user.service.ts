import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../pojo/entities/user.entity';
import { UserDataInitService } from './user-data-init.service';
import { generateUid } from '../utils/id.util';

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
    return await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
      // 创建用户
      const user = this.userRepository.create(userData);
      const savedUser = await transactionalEntityManager.save(user);

      // 初始化用户数据
      await this.userDataInitService.initializeUserData(savedUser.id);

      return savedUser;
    });
  }

  async findByInviteCode(inviteCode: string): Promise<Pick<User, 'id' | 'nickname'>> {
    const user = await this.userRepository.findOne({
      where: { inviteCode },
      select: ['id', 'nickname']
    });

    if (!user) {
      throw new NotFoundException('未找到该邀请码对应的用户');
    }

    return user;
  }

  async resetInviteCode(userId: string): Promise<{ inviteCode: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const newInviteCode = generateUid();
    
    await this.userRepository.update(
      { id: userId },
      { inviteCode: newInviteCode }
    );

    return { inviteCode: newInviteCode };
  }
}
