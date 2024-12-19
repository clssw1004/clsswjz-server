import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountSymbol } from '../pojo/entities/account-symbol.entity';
import { generateUid } from '../utils/id.util';
import { SymbolType } from '../pojo/enums/symbol-type.enum';
import { UpdateAccountSymbolDto } from '../pojo/dto/account-symbol/update-account-symbol.dto';

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
  async remove(id: string): Promise<void> {
    await this.accountSymbolRepository.delete({
      id,
    });
  }

  /**
   * 获取账本下所有类型的数据，按类型分组
   */
  async findAllGroupByType(
    accountBookId: string,
  ): Promise<Record<SymbolType, AccountSymbol[]>> {
    const symbols = await this.accountSymbolRepository.find({
      where: { accountBookId },
      order: { name: 'ASC' },
    });

    // 按类型分组
    return symbols.reduce(
      (acc, symbol) => {
        if (!acc[symbol.symbolType]) {
          acc[symbol.symbolType] = [];
        }
        acc[symbol.symbolType].push(symbol);
        return acc;
      },
      {} as Record<SymbolType, AccountSymbol[]>,
    );
  }

  /**
   * 更新数据
   */
  async update(
    id: string,
    updateDto: UpdateAccountSymbolDto,
    userId: string,
  ): Promise<AccountSymbol> {
    const symbol = await this.accountSymbolRepository.findOne({
      where: { id },
    });

    if (!symbol) {
      throw new NotFoundException('数据不存在');
    }

    try {
      symbol.name = updateDto.name;
      symbol.updatedBy = userId;
      return await this.accountSymbolRepository.save(symbol);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('该名称已存在');
      }
      throw error;
    }
  }
}
