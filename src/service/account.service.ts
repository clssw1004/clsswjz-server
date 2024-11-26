import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { Category } from '../pojo/entities/category.entity';
import { CreateAccountItemDto } from '../pojo/dto/account/create-account-item.dto';
import { UpdateAccountItemDto } from '../pojo/dto/account/update-account-item.dto';
import * as shortid from 'shortid';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountItem)
    private accountItemRepository: Repository<AccountItem>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * 获取或创建分类
   * @param categoryName 分类名称
   * @returns 分类对象和分类编码
   */
  private async getOrCreateCategory(categoryName: string): Promise<Category> {
    let category = await this.categoryRepository.findOneBy({
      name: categoryName,
    });

    if (!category) {
      category = this.categoryRepository.create({
        code: shortid.generate(),
        name: categoryName,
      });
      await this.categoryRepository.save(category);
    }

    return category;
  }

  async create(createAccountItemDto: CreateAccountItemDto) {
    // 处理分类
    const category = await this.getOrCreateCategory(
      createAccountItemDto.category,
    );

    // 创建账目，并关联分类编码
    const accountItem = this.accountItemRepository.create({
      ...createAccountItemDto,
      categoryCode: category.code,
    });

    return this.accountItemRepository.save(accountItem);
  }

  findAll() {
    return this.accountItemRepository.find({
      order: {
        accountDate: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  findOne(id: string) {
    return this.accountItemRepository.findOneBy({ id });
  }

  async update(id: string, updateAccountItemDto: UpdateAccountItemDto) {
    const accountItem = await this.accountItemRepository.findOneBy({ id });
    if (!accountItem) {
      throw new Error('记账条目不存在');
    }

    // 如果更新了分类，需要处理分类逻辑
    if (updateAccountItemDto.category) {
      const category = await this.getOrCreateCategory(
        updateAccountItemDto.category,
      );
      accountItem.categoryCode = category.code;
    }

    Object.assign(accountItem, updateAccountItemDto);
    return this.accountItemRepository.save(accountItem);
  }

  async remove(id: string) {
    const accountItem = await this.accountItemRepository.findOneBy({ id });
    if (!accountItem) {
      throw new Error('记账条目不存在');
    }
    return this.accountItemRepository.remove(accountItem);
  }
}
