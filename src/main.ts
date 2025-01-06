import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { generateApiDocs } from './utils/doc.util';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { json } from 'express';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 添加全局响应转换拦截器
  // app.useGlobalInterceptors(new TransformInterceptor());

  // 添加 CORS 配置
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  app.setGlobalPrefix(configService.get<string>('API_PREFIX', 'api'));
  // 添加全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 添加全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 增加请求体大小限制为10MB
  app.use(json({ limit: '50mb' }));

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('Classwjz Api Document')
    .setDescription('Classwjz Api Document')
    .setVersion('1.0')
    // 如果有认证，添加认证配置
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 生成API文档
  if (configService.get<string>('NODE_ENV') === 'development') {
    generateApiDocs();
  }

  await app.listen(configService.get<string>('PORT') ?? 3000);
}
bootstrap();
