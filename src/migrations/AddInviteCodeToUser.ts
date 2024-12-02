import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddInviteCodeToUser implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 先添加字段
    await queryRunner.addColumn(
      'account_users',
      new TableColumn({
        name: 'invite_code',
        type: 'varchar',
        length: '50',
        isNullable: true, // 临时允许为空
      }),
    );

    // 为现有用户生成邀请码
    await queryRunner.query(`
      UPDATE account_users 
      SET invite_code = LOWER(SUBSTRING(UUID(), 1, 8))
      WHERE invite_code IS NULL
    `);

    // 设置非空和唯一约束
    await queryRunner.changeColumn(
      'account_users',
      'invite_code',
      new TableColumn({
        name: 'invite_code',
        type: 'varchar',
        length: '50',
        isNullable: false,
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('account_users', 'invite_code');
  }
} 