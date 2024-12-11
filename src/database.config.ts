import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // 检查是否配置了必要的 MySQL 环境变量
  const hasRequiredMySQLConfig =
    configService.get('DB_HOST') &&
    configService.get('DB_PORT') &&
    configService.get('DB_USERNAME') &&
    configService.get('DB_PASSWORD') &&
    configService.get('DB_DATABASE');

  // 获取数据库类型，如果未配置或配置不完整，默认使用 sqlite
  const dbType = hasRequiredMySQLConfig
    ? configService.get('DB_TYPE', 'sqlite')
    : 'sqlite';
  const dbPath = configService.get(
    'DB_DATABASE',
    `${configService.get('DATA_PATH') || '/data'}/clsswjz.sqlite`,
  );
  const absoluteDbPath = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), dbPath);

  // 检查数据库文件是否存在，不存在则需要同步表结构
  const shouldSync = dbType === 'sqlite' 
    ? !fs.existsSync(absoluteDbPath)
    : !hasRequiredMySQLConfig || configService.get('DB_FORCE_SYNC') === 'true';

  if (shouldSync) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `Database schema synchronization is enabled because:
${dbType === 'sqlite' ? '- SQLite database file does not exist' : '- MySQL configuration is incomplete or DB_FORCE_SYNC is true'}
Tables will be automatically created/updated.
WARNING: This should be disabled in production!
      `,
    );
  }

  if (dbType === 'sqlite') {
    // 如果使用 SQLite，且是因为 MySQL 配置不完整，打印提示信息
    if (!hasRequiredMySQLConfig && configService.get('DB_TYPE') !== 'sqlite') {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        `
WARNING: MySQL configuration is incomplete or missing. 
Using SQLite as the default database, data store path: ${absoluteDbPath}. 
If you run with docker, please mount the volume to this path.
To use MySQL, please configure the following environment variables:
- DB_TYPE=mysql
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

  // MySQL 配置
  const datasourceConfig = {
    type: dbType,
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
