import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { generateUid } from '../utils/id.util';
import { CreateAccountShopDto } from '../pojo/dto/account-shop/create-account-shop.dto';
import { UpdateAccountShopDto } from '../pojo/dto/account-shop/update-account-shop.dto';

@Injectable()
export class AccountShopService {
  constructor(
    @InjectRepository(AccountShop)
    private accountShopRepository: Repository<AccountShop>,
  ) {}

  /**
   * 获取或创建商家
   */
  async getOrCreateShop(
    name: string,
    accountBookId: string,
    userId: string,
  ): Promise<AccountShop> {
    let shop = await this.accountShopRepository.findOne({
      where: {
        name,
        accountBookId,
      },
    });

    if (!shop) {
      shop = this.accountShopRepository.create({
        name,
        shopCode: generateUid(),
        accountBookId,
        createdBy: userId,
        updatedBy: userId,
      });
      await this.accountShopRepository.save(shop);
    }
    return shop;
  }

  /**
   * 创建商家
   */
  async create(
    createDto: CreateAccountShopDto,
    userId: string,
  ): Promise<AccountShop> {
    // 检查同一账本下是否存在同名商家
    const existingShop = await this.accountShopRepository.findOne({
      where: {
        name: createDto.name,
        accountBookId: createDto.accountBookId,
      },
    });

    if (existingShop) {
      throw new ConflictException('该账本下已存在同名商家');
    }

    const shop = this.accountShopRepository.create({
      name: createDto.name,
      accountBookId: createDto.accountBookId,
      shopCode: generateUid(),
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.accountShopRepository.save(shop);
  }

  async findAll(accountBookId: string) {
    return await this.accountShopRepository.find({
      where: { accountBookId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    return await this.accountShopRepository.findOneBy({ id });
  }

  async remove(id: string) {
    const shop = await this.findOne(id);
    if (shop) {
      await this.accountShopRepository.remove(shop);
    }
  }

  /**
   * 更新商家信息
   */
  async update(
    id: string,
    updateDto: UpdateAccountShopDto,
    userId: string,
  ): Promise<AccountShop> {
    const shop = await this.accountShopRepository.findOne({
      where: { id },
    });

    if (!shop) {
      throw new NotFoundException('商家不存在');
    }

    // 检查同一账本下是否存在同名商家
    const existingShop = await this.accountShopRepository.findOne({
      where: {
        name: updateDto.name,
        accountBookId: shop.accountBookId,
        id: Not(id), // 排除当前商家
      },
    });

    if (existingShop) {
      throw new ConflictException('该账本下已存在同名商家');
    }

    // 更新商家信息
    shop.name = updateDto.name;
    shop.updatedBy = userId;

    return await this.accountShopRepository.save(shop);
  }
}
