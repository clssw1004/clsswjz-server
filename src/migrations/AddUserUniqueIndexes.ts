import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddUserUniqueIndexes implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加用户名唯一索引
    await queryRunner.createIndex(
      'account_users',
      new TableIndex({
        name: 'IDX_USER_USERNAME',
        columnNames: ['username'],
        isUnique: true,
      }),
    );

    // 添加邮箱唯一索引
    await queryRunner.createIndex(
      'account_users',
      new TableIndex({
        name: 'IDX_USER_EMAIL',
        columnNames: ['email'],
        isUnique: true,
        where: 'email IS NOT NULL', // 只对非空的邮箱值创建唯一索引
      }),
    );

    // 添加邀请码唯一索引
    await queryRunner.createIndex(
      'account_users',
      new TableIndex({
        name: 'IDX_USER_INVITE_CODE',
        columnNames: ['invite_code'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除所有添加的索引
    await queryRunner.dropIndex('account_users', 'IDX_USER_USERNAME');
    await queryRunner.dropIndex('account_users', 'IDX_USER_EMAIL');
    await queryRunner.dropIndex('account_users', 'IDX_USER_INVITE_CODE');
  }
} 