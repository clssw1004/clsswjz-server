import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminBookService } from './admin-book.service';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { User } from '../pojo/entities/user.entity';

describe('AdminBookService', () => {
  const ENTITIES = [AccountBook, AccountBookUser, AccountItem, User];

  let dataSource: DataSource;
  let service: AdminBookService;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();
    service = new AdminBookService(
      dataSource.getRepository(AccountBook),
      dataSource.getRepository(AccountBookUser),
      dataSource.getRepository(AccountItem),
      dataSource.getRepository(User),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.getRepository(AccountBook).clear();
    await dataSource.getRepository(AccountBookUser).clear();
    await dataSource.getRepository(AccountItem).clear();
    await dataSource.getRepository(User).clear();
  });

  async function makeUser(id: string, nickname: string) {
    const u = new User();
    Object.assign(u, { id, username: id, nickname, password: 'x' });
    await dataSource.getRepository(User).save(u);
  }

  async function makeBook(id: string, owner: string, name: string) {
    const b = new AccountBook();
    Object.assign(b, {
      id,
      name,
      createdBy: owner,
      updatedBy: owner,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountBook).save(b);
  }

  async function makeMember(bookId: string, userId: string) {
    const rel = new AccountBookUser();
    Object.assign(rel, {
      id: `rel-${bookId}-${userId}`,
      userId,
      accountBookId: bookId,
      canViewBook: true,
      canViewItem: true,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountBookUser).save(rel);
  }

  async function makeItem(id: string, bookId: string) {
    const i = new AccountItem();
    Object.assign(i, {
      id,
      accountBookId: bookId,
      amount: 10,
      type: 'EXPENSE',
      categoryCode: 'c1',
      fundId: 'f1',
      accountDate: '2026-08-01 10:00:00',
      createdBy: 'owner1',
      updatedBy: 'owner1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountItem).save(i);
  }

  it('listBooks enriches owner name, member count and item count', async () => {
    await makeUser('owner1', '阿树');
    await makeUser('m1', '小明');
    await makeBook('b1', 'owner1', '家庭账本');
    await makeMember('b1', 'owner1');
    await makeMember('b1', 'm1');
    await makeItem('i1', 'b1');
    await makeItem('i2', 'b1');

    const { items, total } = await service.listBooks({ page: 1, pageSize: 10 });

    expect(total).toBe(1);
    expect(items[0].name).toBe('家庭账本');
    expect(items[0].ownerName).toBe('阿树');
    expect(items[0].memberCount).toBe(2); // 创建者 + 成员
    expect(items[0].itemCount).toBe(2);
  });

  it('listBooks filters by keyword and paginates', async () => {
    await makeUser('u1', 'u1');
    await makeBook('b1', 'u1', '家庭账本');
    await makeBook('b2', 'u1', '旅行账本');

    const { total } = await service.listBooks({ page: 1, pageSize: 10, keyword: '旅行' });
    expect(total).toBe(1);
  });

  it('getBookDetail returns book with members', async () => {
    await makeUser('owner1', '阿树');
    await makeUser('m1', '小明');
    await makeBook('b1', 'owner1', '家庭账本');
    await makeMember('b1', 'm1');

    const detail = await service.getBookDetail('b1');

    expect(detail.book.name).toBe('家庭账本');
    expect(detail.book.ownerName).toBe('阿树');
    expect(detail.members).toHaveLength(1);
    expect(detail.members[0].nickname).toBe('小明');
  });

  it('getBookDetail throws NotFound for missing book', async () => {
    await expect(service.getBookDetail('ghost')).rejects.toThrow(NotFoundException);
  });
});
