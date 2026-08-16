import { DataSource, Repository } from 'typeorm';
import {
  AttachmentEntity,
  BusinessCode,
} from '../pojo/entities/attachment.entity';
import { AccountItem } from '../pojo/entities/account-item.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { AttachmentService } from './attachment.service';

describe('AttachmentService.authorizeDownload', () => {
  let dataSource: DataSource;
  let service: AttachmentService;
  let attachmentRepo: Repository<AttachmentEntity>;
  let itemRepo: Repository<AccountItem>;

  const configMock = {
    get: (key: string) =>
      key === 'DATA_PATH' ? '/tmp/clsswjz-test-data' : null,
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [AttachmentEntity, AccountItem, AccountBook, AccountBookUser],
      synchronize: true,
    });
    await dataSource.initialize();

    attachmentRepo = dataSource.getRepository(AttachmentEntity);
    itemRepo = dataSource.getRepository(AccountItem);
    service = new AttachmentService(
      attachmentRepo,
      configMock as any,
      dataSource,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await attachmentRepo.clear();
    await itemRepo.clear();
    await dataSource.getRepository(AccountBook).clear();
    await dataSource.getRepository(AccountBookUser).clear();
  });

  async function makeBook(id: string, createdBy: string) {
    const book = new AccountBook();
    Object.assign(book, {
      id,
      name: `账本${id}`,
      createdBy,
      updatedBy: createdBy,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await dataSource.getRepository(AccountBook).save(book);
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

  async function makeItem(itemId: string, bookId: string) {
    const item = new AccountItem();
    Object.assign(item, {
      id: itemId,
      amount: 10,
      type: 'EXPENSE',
      accountBookId: bookId,
      categoryCode: 'c1',
      fundId: 'f1',
      accountDate: '2026-08-12 12:00:00',
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: 1000,
      updatedAt: 1000,
    });
    await itemRepo.save(item);
  }

  async function makeAttachment(
    attId: string,
    businessCode: BusinessCode,
    businessId: string,
    createdBy: string,
  ) {
    const att = new AttachmentEntity();
    Object.assign(att, {
      id: attId,
      originName: 'a.jpg',
      fileLength: 10,
      extension: 'jpg',
      contentType: 'image/jpeg',
      businessCode,
      businessId,
      createdBy,
      updatedBy: createdBy,
      createdAt: 1000,
      updatedAt: 1000,
    });
    await attachmentRepo.save(att);
  }

  it('allows a book member to download an attachment of an item in that book', async () => {
    await makeBook('b1', 'u1');
    await makeMember('b1', 'u2');
    await makeItem('item-1', 'b1');
    await makeAttachment('att-1', BusinessCode.ITEM, 'item-1', 'u1');

    expect(await service.authorizeDownload('att-1', 'u2')).toBe(true);
  });

  it('denies a non-member even if the item exists in another book', async () => {
    await makeBook('b1', 'u1');
    await makeItem('item-1', 'b1');
    await makeAttachment('att-1', BusinessCode.ITEM, 'item-1', 'u1');

    expect(await service.authorizeDownload('att-1', 'u3')).toBe(false);
  });

  it('denies download when the item is not materialized yet', async () => {
    await makeBook('b1', 'u1');
    await makeMember('b1', 'u2');
    await makeAttachment('att-1', BusinessCode.ITEM, 'item-ghost', 'u1');

    expect(await service.authorizeDownload('att-1', 'u2')).toBe(false);
  });

  it('allows only the owner for non-book (e.g. user profile) attachments', async () => {
    await makeAttachment('att-user', BusinessCode.USER, 'u2', 'u2');

    expect(await service.authorizeDownload('att-user', 'u2')).toBe(true);
    expect(await service.authorizeDownload('att-user', 'u1')).toBe(false);
  });

  it('throws NotFoundException for a missing attachment', async () => {
    await expect(
      service.authorizeDownload('att-missing', 'u1'),
    ).rejects.toThrow('附件不存在');
  });
});
