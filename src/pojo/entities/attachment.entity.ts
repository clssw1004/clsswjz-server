import { Column, Entity } from 'typeorm';
import { BaseBusinessEntity } from './base.entity';

export enum BusinessCode {
  ITEM = 'item',
  BOOK = 'book',
  FUND = 'fund',
  USER = 'user',
}

@Entity('attachment')
export class  AttachmentEntity extends BaseBusinessEntity {
  @Column({ name: 'origin_name', comment: '源文件名' })
  originName: string;

  @Column({ name: 'file_length', comment: '文件大小' })
  fileLength: number;

  @Column({ name: 'extension', comment: '文件后缀' })
  extension: string;

  @Column({ name: 'content_type', comment: '文件媒体类型' })
  contentType: string;

  @Column({
    name: 'business_code',
    comment: '文件所属业务',
    type: 'varchar',
    length: 20,
  })
  businessCode: BusinessCode;

  @Column({ name: 'business_id', comment: '文件所属数据ID' })
  businessId: string;
} 