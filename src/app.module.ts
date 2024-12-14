import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config';
import { AccountModule } from './modules/account.module';
import { AuthModule } from './modules/auth.module';
import { AttachmentModule } from './modules/attachment.module';

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
  ],
})
export class AppModule {}
