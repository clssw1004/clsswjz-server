import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbType = configService.get('DB_TYPE');
  if (dbType === 'sqlite') {
    return {
      type: 'sqlite',
      database: configService.get('DB_DATABASE', 'db.sqlite'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: configService.get('NODE_ENV') !== 'production',
      logging: true,
    };
  }

  const datasourceConfig = {
    type: dbType,
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: true,
  };
  console.log(datasourceConfig);
  return datasourceConfig;
};
