import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminNoteService } from './admin-note.service';
import { AccountNote } from '../pojo/entities/account-note.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { User } from '../pojo/entities/user.entity';

describe('AdminNoteService', () => {
  const ENTITIES = [AccountNote, AccountBook, User];

  let dataSource: DataSource;
  let service: AdminNoteService;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true,
    });
    await dataSource.initialize();
    service = new AdminNoteService(
      dataSource.getRepository(AccountNote),
      dataSource.getRepository(AccountBook),
      dataSource.getRepository(User),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.getRepository(AccountNote).clear();
    await dataSource.getRepository(AccountBook).clear();
    await dataSource.getRepository(User).clear();
  });

  async function makeBook(id: string, owner: string) {
    const b = new AccountBook();
    Object.assign(b, {
      id,
      name: '账本',
      createdBy: owner,
      updatedBy: owner,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountBook).save(b);
  }

  async function makeUser(id: string, nickname: string) {
    const u = new User();
    Object.assign(u, { id, username: id, nickname, password: 'x' });
    await dataSource.getRepository(User).save(u);
  }

  async function makeNote(id: string, bookId: string, creator: string, noteType: string, title: string) {
    const n = new AccountNote();
    Object.assign(n, {
      id,
      accountBookId: bookId,
      title,
      noteType,
      content: '内容' + title,
      scope: 'book',
      createdBy: creator,
      updatedBy: creator,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountNote).save(n);
  }

  it('listNotes returns notes for a book with creator names', async () => {
    await makeBook('b1', 'u1');
    await makeUser('u1', '阿树');
    await makeNote('n1', 'b1', 'u1', 'NOTE', '买菜清单');
    await makeNote('n2', 'b1', 'u1', 'TODO', '待办事项');

    const { items, total } = await service.listNotes({ bookId: 'b1', page: 1, pageSize: 10 });

    expect(total).toBe(2);
    expect(items[0].title).toBe('买菜清单');
    expect(items[0].createdByName).toBe('阿树');
  });

  it('listNotes filters by noteType', async () => {
    await makeBook('b1', 'u1');
    await makeNote('n1', 'b1', 'u1', 'NOTE', '笔记');
    await makeNote('n2', 'b1', 'u1', 'REPORT', '报告');

    const { total } = await service.listNotes({ bookId: 'b1', type: 'REPORT', page: 1, pageSize: 10 });
    expect(total).toBe(1);
  });

  it('getNoteDetail returns the note or throws NotFound', async () => {
    await makeBook('b1', 'u1');
    await makeNote('n1', 'b1', 'u1', 'NOTE', '笔记');
    const detail = await service.getNoteDetail('n1');
    expect(detail.title).toBe('笔记');
    await expect(service.getNoteDetail('ghost')).rejects.toThrow(NotFoundException);
  });
});
