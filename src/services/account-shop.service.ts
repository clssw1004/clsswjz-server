import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountShop } from '../pojo/entities/account-shop.entity';
import { generateUid } from '../utils/id.util';

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
}
