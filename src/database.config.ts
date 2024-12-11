import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';

export const getDatabaseConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  // 检查是否配置了必要的 MySQL/PostgreSQL 环境变量
  const hasRequiredDBConfig =
    configService.get('DB_HOST') &&
    configService.get('DB_PORT') &&
    configService.get('DB_USERNAME') &&
    configService.get('DB_PASSWORD') &&
    configService.get('DB_DATABASE');

  // 获取数据库类型，如果未配置或配置不完整，默认使用 sqlite
  const dbType = hasRequiredDBConfig
    ? configService.get('DB_TYPE', 'sqlite')
    : 'sqlite';
  const dbPath = configService.get(
    'DB_DATABASE',
    `${configService.get('DATA_PATH') || '/data'}/clsswjz.sqlite`,
  );
  const absoluteDbPath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), dbPath);

  // 检查数据库表结构是否需要初始化
  let shouldSync = false;

  if (dbType === 'sqlite') {
    // SQLite: 检查数据库文件是否存在
    shouldSync = !fs.existsSync(absoluteDbPath);
  } else {
    // MySQL/PostgreSQL: 检查数据库表是否存在
    try {
      const tempDataSource = new DataSource({
        type: dbType as any,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
      });

      await tempDataSource.initialize();

      // 检查是否存在用户表（作为判断依据）
      const hasTable = await tempDataSource.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = '${configService.get<string>('DB_DATABASE')}' 
        AND table_name = 'users'
      `);

      await tempDataSource.destroy();

      shouldSync =
        Number(hasTable[0].count) === 0 || configService.get('DB_FORCE_SYNC') === 'true';
    } catch (error) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        `Failed to check database tables: ${error.message}
Enabling schema synchronization...`,
      );
      shouldSync = true;
    }
  }

  if (shouldSync) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `Database schema synchronization is enabled because:
${
  dbType === 'sqlite'
    ? '- SQLite database file does not exist'
    : shouldSync
      ? '- Database tables are not initialized or DB_FORCE_SYNC is true'
      : '- Failed to check database tables'
}
Tables will be automatically created/updated.
WARNING: This should be disabled in production!
      `,
    );
  }

  if (dbType === 'sqlite') {
    // SQLite 配置
    if (!hasRequiredDBConfig && configService.get('DB_TYPE') !== 'sqlite') {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        `
WARNING: Database configuration is incomplete or missing. 
Using SQLite as the default database, data store path: ${absoluteDbPath}. 
If you run with docker, please mount the volume to this path.
To use MySQL/PostgreSQL, please configure the following environment variables:
- DB_TYPE=(mysql|postgres)
- DB_HOST
- DB_PORT
- DB_USERNAME
- DB_PASSWORD
- DB_DATABASE
        `,
      );
    }

    // 确保数据目录存在
    const dataDir = path.dirname(absoluteDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    return {
      type: 'sqlite',
      database: absoluteDbPath,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: shouldSync,
      logging: configService.get('NODE_ENV') === 'development',
    };
  }

  // MySQL/PostgreSQL 配置
  const datasourceConfig = {
    type: dbType as any,
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: shouldSync,
    logging: configService.get('NODE_ENV') === 'development',
  };

  return datasourceConfig;
};
