import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccountNote } from '../pojo/entities/account-note.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { User } from '../pojo/entities/user.entity';

/** 记事管理：按账本分页展示笔记/待办/报告 */
@Injectable()
export class AdminNoteService {
  constructor(
    @InjectRepository(AccountNote)
    private readonly noteRepository: Repository<AccountNote>,
    @InjectRepository(AccountBook)
    private readonly bookRepository: Repository<AccountBook>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** 某账本的分页记事列表（可按类型过滤） */
  async listNotes(params: {
    bookId: string;
    type?: string;
    page: number;
    pageSize: number;
  }) {
    const book = await this.bookRepository.findOneBy({ id: params.bookId });
    if (!book) throw new NotFoundException('账本不存在');

    const qb = this.noteRepository
      .createQueryBuilder('n')
      .where('n.accountBookId = :bookId', { bookId: params.bookId });
    if (params.type) {
      qb.andWhere('n.noteType = :type', { type: params.type });
    }
    const [notes, total] = await qb
      .orderBy('n.updatedAt', 'DESC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount();

    const createdByIds = [...new Set(notes.map((n) => n.createdBy))];
    const users = createdByIds.length
      ? await this.userRepository.findBy({ id: In(createdByIds) })
      : [];
    const userMap = new Map(
      users.map((u) => [u.id, u.nickname || u.username]),
    );

    return {
      items: notes.map((n) => ({
        ...n,
        createdByName: userMap.get(n.createdBy) ?? n.createdBy,
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /** 记事详情 */
  async getNoteDetail(noteId: string) {
    const note = await this.noteRepository.findOneBy({ id: noteId });
    if (!note) throw new NotFoundException('记事不存在');
    return note;
  }
}
