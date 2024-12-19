import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { generateUid } from '../utils/id.util';
import { SymbolType } from '../pojo/enums/symbol-type.enum';

@Injectable()
export class AccountSymbolService {
  constructor(
    @InjectRepository(AccountSymbol)
    private accountSymbolRepository: Repository<AccountSymbol>,
  ) {}

  /**
   * 获取账本下指定类型的所有数据
   */
  async findAll(
    accountBookId: string,
    symbolType: SymbolType,
  ): Promise<AccountSymbol[]> {
    return await this.accountSymbolRepository.find({
      where: { accountBookId, symbolType },
      order: { name: 'ASC' },
    });
  }

  /**
   * 获取或创建数据
   */
  async getOrCreate(
    name: string,
    symbolType: SymbolType,
    accountBookId: string,
    userId: string,
  ): Promise<AccountSymbol> {
    // 查找现有数据
    let symbol = await this.accountSymbolRepository.findOne({
      where: {
        name,
        symbolType,
        accountBookId,
      },
    });

    // 如果不存在则创建
    if (!symbol) {
      symbol = this.accountSymbolRepository.create({
        name,
        code: generateUid(),
        symbolType,
        accountBookId,
        createdBy: userId,
        updatedBy: userId,
      });

      try {
        await this.accountSymbolRepository.save(symbol);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new ConflictException('该数据已存在');
        }
        throw error;
      }
    }

    return symbol;
  }

  /**
   * 删除数据
   */
  async remove(
    accountBookId: string,
    symbolType: SymbolType,
    code: string,
  ): Promise<void> {
    await this.accountSymbolRepository.delete({
      accountBookId,
      symbolType,
      code,
    });
  }
}
