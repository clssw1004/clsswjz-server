import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { generateApiDocs } from './utils/doc.util';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 添加 CORS 配置
  app.enableCors({
    origin: true, // 允许所有来源，生产环境建议设置具体的域名
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api'));
  // 添加全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 去除在 DTO 中未定义的属性
      transform: true, // 自动转换类型
      forbidNonWhitelisted: true, // 当出现未定义的属性时抛出错误
    }),
  );

  // 生成API文档
  if (process.env.NODE_ENV === 'development') {
    generateApiDocs();
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
