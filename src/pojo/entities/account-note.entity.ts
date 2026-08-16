import { Entity, Column } from 'typeorm';
import { BaseBusinessEntityWithAccountBook } from './base.entity';

/**
 * 记事实体（笔记/待办/月度报告），与 Flutter account_note 对齐。
 * 注意：group_code 在客户端列名为驼峰 groupCode，保持一致。
 */
@Entity('account_notes')
export class AccountNote extends BaseBusinessEntityWithAccountBook {
  @Column({
    length: 200,
    nullable: true,
    name: 'title',
    comment: '标题',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'content',
    comment: '内容',
  })
  content: string;

  @Column({
    length: 20,
    name: 'note_type',
    comment: '类型：NOTE-笔记，TODO-待办，REPORT-报告',
  })
  noteType: string;

  @Column({
    length: 50,
    nullable: true,
    name: 'groupCode',
    comment: '分组编码',
  })
  groupCode: string;

  @Column({
    length: 20,
    default: 'book',
    name: 'scope',
    comment: '作用域：book-账本内',
  })
  scope: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'template',
    comment: '模板内容',
  })
  template: string;
}
