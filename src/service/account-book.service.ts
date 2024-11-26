import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { CreateAccountBookDto } from '../pojo/dto/account-book/create-account-book.dto';
import { UpdateAccountBookDto } from '../pojo/dto/account-book/update-account-book.dto';
import { AccountItem } from '../pojo/entities/account-item.entity';

@Injectable()
export class AccountBookService {
  constructor(
    @InjectRepository(AccountBook)
    private accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountItem)
    private accountItemRepository: Repository<AccountItem>,
  ) {}

  async create(createAccountBookDto: CreateAccountBookDto) {
    const accountBook = this.accountBookRepository.create(createAccountBookDto);
    return this.accountBookRepository.save(accountBook);
  }

  async findAll() {
    return this.accountBookRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const accountBook = await this.accountBookRepository.findOneBy({ id });
    if (!accountBook) {
      throw new Error('账本不存在');
    }
    return accountBook;
  }

  async update(id: string, updateAccountBookDto: UpdateAccountBookDto) {
    const accountBook = await this.accountBookRepository.findOneBy({ id });
    if (!accountBook) {
      throw new Error('账本不存在');
    }

    Object.assign(accountBook, updateAccountBookDto);
    return this.accountBookRepository.save(accountBook);
  }

  async remove(id: string) {
    const accountBook = await this.accountBookRepository.findOneBy({ id });
    if (!accountBook) {
      throw new Error('账本不存在');
    }

    const hasItems = await this.accountItemRepository.findOneBy({
      accountBookId: id,
    });
    if (hasItems) {
      throw new Error('该账本下存在账目记录，无法删除');
    }

    return this.accountBookRepository.remove(accountBook);
  }
}
