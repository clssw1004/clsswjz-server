import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { User } from '../pojo/entities/user.entity';

/**
 * 账本管理：账本列表（所有者/成员/记账笔数）+ 账本详情（成员关系、数据字典规模）。
 */
@Injectable()
export class AdminBookService {
  constructor(
    @InjectRepository(AccountBook)
    private readonly bookRepository: Repository<AccountBook>,
    @InjectRepository(AccountBookUser)
    private readonly bookUserRepository: Repository<AccountBookUser>,
    @InjectRepository(AccountItem)
    private readonly itemRepository: Repository<AccountItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 账本分页列表，附所有者昵称、成员数、记账笔数 */
  async listBooks(params: { page: number; pageSize: number; keyword?: string }) {
    const qb = this.bookRepository.createQueryBuilder('b');
    if (params.keyword) {
      qb.where('b.name LIKE :kw', { kw: `%${params.keyword}%` });
    }
    const [books, total] = await qb
      .orderBy('b.createdAt', 'DESC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount();

    const ownerIds = [...new Set(books.map((b) => b.createdBy))];
    const owners = ownerIds.length
      ? await this.userRepository.findBy({ id: In(ownerIds) })
      : [];
    const ownerMap = new Map(
      owners.map((u) => [u.id, u.nickname || u.username]),
    );
    const bookIds = books.map((b) => b.id);

    const memberCounts = await this.bookUserRepository
      .createQueryBuilder('rel')
      .select('rel.accountBookId', 'bookId')
      .addSelect('COUNT(*)', 'count')
      .where('rel.accountBookId IN (:...bookIds)', { bookIds })
      .groupBy('rel.accountBookId')
      .getRawMany();
    const memberCountMap = new Map(
      memberCounts.map((r) => [r.bookId, Number(r.count)]),
    );

    const itemCounts = await this.itemRepository
      .createQueryBuilder('i')
      .select('i.accountBookId', 'bookId')
      .addSelect('COUNT(*)', 'count')
      .where('i.accountBookId IN (:...bookIds)', { bookIds })
      .groupBy('i.accountBookId')
      .getRawMany();
    const itemCountMap = new Map(itemCounts.map((r) => [r.bookId, Number(r.count)]));

    return {
      items: books.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        ownerName: ownerMap.get(b.createdBy) ?? b.createdBy,
        memberCount: memberCountMap.get(b.id) ?? 1, // 创建者本身算一个
        itemCount: itemCountMap.get(b.id) ?? 0,
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /** 账本详情：基本信息 + 所有者 + 成员关系 + 数据规模 */
  async getBookDetail(bookId: string) {
    const book = await this.bookRepository.findOneBy({ id: bookId });
    if (!book) throw new NotFoundException('账本不存在');

    const owner = await this.userRepository.findOneBy({ id: book.createdBy });

    const rels = await this.bookUserRepository
      .createQueryBuilder('rel')
      .where('rel.accountBookId = :bookId', { bookId })
      .getMany();
    const memberIds = rels.map((r) => r.userId);
    const members = memberIds.length
      ? await this.userRepository.findBy({ id: In(memberIds) })
      : [];
    const userMap = new Map(members.map((u) => [u.id, u]));

    const itemCount = await this.itemRepository.count({
      where: { accountBookId: bookId },
    });

    return {
      book: {
        id: book.id,
        name: book.name,
        description: book.description,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        ownerName: owner ? owner.nickname || owner.username : book.createdBy,
      },
      members: rels.map((rel) => {
        const u = userMap.get(rel.userId);
        return {
          userId: rel.userId,
          username: u?.username,
          nickname: u?.nickname,
          canViewBook: rel.canViewBook,
          canEditBook: rel.canEditBook,
          canViewItem: rel.canViewItem,
          canEditItem: rel.canEditItem,
        };
      }),
      itemCount,
    };
  }
}
