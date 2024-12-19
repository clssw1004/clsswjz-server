import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, EntityManager } from 'typeorm';
import { AccountCategory } from '../pojo/entities/account-category.entity';
import { QueryCategoryDto } from '../pojo/dto/category/query-category.dto';
import { DEFAULT_CATEGORIES } from '../config/default-categories.config';
import { generateUid } from '../utils/id.util';
import { CreateCategoryDto } from '../pojo/dto/category/create-category.dto';
import { ItemType } from 'src/pojo/enums/item-type.enum';

@Injectable()
export class AccountCategoryService {
  constructor(
    @InjectRepository(AccountCategory)
    private categoryRepository: Repository<AccountCategory>,
  ) {}

  // 检查分类名称是否存在
  private async checkNameExists(
    name: string,
    categoryType: ItemType,
    accountBookId: string,
  ): Promise<boolean> {
    const count = await this.categoryRepository.count({
      where: {
        name,
        categoryType,
        accountBookId,
      },
    });
    return count > 0;
  }

  // 创建分类
  async create(
    category: CreateCategoryDto,
    userId: string,
  ): Promise<AccountCategory> {
    // 检查名称是否重复
    const nameExists = await this.checkNameExists(
      category.name,
      category.categoryType,
      category.accountBookId,
    );
    if (nameExists) {
      throw new ConflictException(
        `分类名称 "${category.name}" 在当前账本中已存在`,
      );
    }

    // 如果没有提供 code，使用 shortid 生成
    const newCategory = this.categoryRepository.create({
      ...category,
      code: generateUid(),
      createdBy: userId,
      updatedBy: userId,
    });
    return await this.categoryRepository.save(newCategory);
  }

  // 获取所有分类
  async findAll(query: QueryCategoryDto): Promise<AccountCategory[]> {
    const whereCondition: any = {
      accountBookId: query.accountBookId,
    };

    // 如果提供了分类名称，添加模糊查询条件
    if (query.name) {
      whereCondition.name = Like(`%${query.name}%`);
    }

    return await this.categoryRepository.find({
      where: whereCondition,
      order: {
        lastAccountItemAt: 'desc',
        name: 'asc', // 按分类名称排序
      },
    });
  }

  // 根据ID查找分类
  async findOne(id: string): Promise<AccountCategory> {
    return await this.categoryRepository.findOne({
      where: { id },
    });
  }

  // 更新分类
  async update(
    id: string,
    category: Partial<AccountCategory>,
  ): Promise<AccountCategory> {
    const existingCategory = await this.findOne(id);
    if (!existingCategory) {
      throw new NotFoundException('分类不存在');
    }

    // 不允许更改分类类型
    if (
      category.categoryType &&
      category.categoryType !== existingCategory.categoryType
    ) {
      throw new Error('分类类型不允许修改');
    }

    await this.categoryRepository.update(id, category);
    return await this.findOne(id);
  }

  // 软删除分类
  async remove(id: string): Promise<void> {
    await this.categoryRepository.update(id, {});
  }

  /**
   * 批量创建默认分类
   */
  async createDefaultCategories(
    manager: EntityManager,
    accountBookId: string,
    userId: string,
  ): Promise<void> {
    const categories = DEFAULT_CATEGORIES.map((category) =>
      this.categoryRepository.create({
        name: category.name,
        code: generateUid(),
        accountBookId,
        categoryType: category.type, // 添加分类类型
        createdBy: userId,
        updatedBy: userId,
      }),
    );

    await manager.save(AccountCategory, categories);
  }

  /**
   * 获取或创建分类
   * @param categoryName 分类名称
   * @param accountBookId 账本ID
   * @param userId 用户ID
   * @returns 分类对象
   */
  async getOrCreateCategory(
    categoryName: string,
    categoryType: ItemType,
    accountBookId: string,
    userId: string,
  ): Promise<AccountCategory> {
    let category = await this.categoryRepository.findOneBy({
      name: categoryName,
      accountBookId,
    });

    if (!category) {
      category = this.categoryRepository.create({
        code: generateUid(),
        name: categoryName,
        categoryType,
        accountBookId,
        createdBy: userId,
        updatedBy: userId,
      });
      await this.categoryRepository.save(category);
    }
    return category;
  }
}
