import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../pojo/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username: userData.username },
    });

    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }
}
