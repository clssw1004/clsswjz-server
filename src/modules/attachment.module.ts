import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AttachmentEntity } from '../pojo/entities/attachment.entity';
import { AttachmentService } from '../services/attachment.service';
import { AttachmentController } from '../controllers/attachment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity]), ConfigModule],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
