import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentEntity } from '../pojo/entities/attachment.entity';
import { AttachmentService } from '../services/attachment.service';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {} 