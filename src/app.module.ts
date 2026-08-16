import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import * as fs from 'fs';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { getDatabaseConfig } from './database.config';
import { AccountModule } from './modules/account.module';
import { AuthModule } from './modules/auth.module';
import { AttachmentModule } from './modules/attachment.module';
import { SyncModule } from './modules/sync.module';
import { CacheModule } from './modules/cache.module';
import { AdminModule } from './modules/admin.module';
import { SimpleLoggerInterceptor } from './interceptors/logger.interceptor';

// 生产托管 admin-web 构建产物（SPA 历史路由 fallback）；
// admin-web/dist 不存在时（纯 API 开发 / 未构建前端）不注册静态服务
const adminDist = path.join(__dirname, '..', 'admin-web', 'dist');
const serveStaticModules = fs.existsSync(adminDist)
  ? [
      ServeStaticModule.forRoot({
        rootPath: adminDist,
        exclude: ['/api*'],
        renderPath: '*',
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return getDatabaseConfig(configService);
      },
    }),
    AccountModule,
    AuthModule,
    AttachmentModule,
    SyncModule,
    CacheModule,
    AdminModule,
    ...serveStaticModules,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    }, {
      provide: APP_INTERCEPTOR,
      useClass: SimpleLoggerInterceptor,
    },
  ],
})
export class AppModule { }
