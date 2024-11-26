import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128, comment: '分类名称' })
  name: string;

  @Column({ length: 16, unique: true, comment: '分类编码' })
  code: string;

  @Column({ default: false, comment: '是否已删除' })
  isDeleted: boolean;
}
