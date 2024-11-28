import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category } from '../pojo/entities/category.entity';
import { QueryCategoryDto } from '../pojo/dto/category/query-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  // 创建分类
  async create(category: Partial<Category>): Promise<Category> {
    const newCategory = this.categoryRepository.create(category);
    return await this.categoryRepository.save(newCategory);
  }

  // 获取所有分类
  async findAll(query: QueryCategoryDto): Promise<Category[]> {
    const whereCondition: any = {
      isDeleted: false,
      accountBookId: query.accountBookId,
    };

    // 如果提供了分类名称，添加模糊查询条件
    if (query.name) {
      whereCondition.name = Like(`%${query.name}%`);
    }

    return await this.categoryRepository.find({
      where: whereCondition,
      order: {
        name: 'ASC',  // 按分类名称排序
      },
    });
  }

  // 根据ID查找分类
  async findOne(id: string): Promise<Category> {
    return await this.categoryRepository.findOne({
      where: { id, isDeleted: false },
    });
  }

  // 更新分类
  async update(id: string, category: Partial<Category>): Promise<Category> {
    await this.categoryRepository.update(id, category);
    return await this.findOne(id);
  }

  // 软删除分类
  async remove(id: string): Promise<void> {
    await this.categoryRepository.update(id, { isDeleted: true });
  }
}
