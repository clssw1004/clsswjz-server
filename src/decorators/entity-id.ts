import { PrimaryGeneratedColumn } from 'typeorm';

export function EntityId() {
  return PrimaryGeneratedColumn('uuid', {
    name: 'id',
    comment: '主键ID',
  });
}
