import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttachmentEntity, BusinessCode } from '../pojo/entities/attachment.entity';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  async create(attachment: Partial<AttachmentEntity>): Promise<AttachmentEntity> {
    const newAttachment = this.attachmentRepository.create(attachment);
    return await this.attachmentRepository.save(newAttachment);
  }

  async createBatch(
    businessCode: BusinessCode,
    businessId: string,
    files: Express.Multer.File[],
  ): Promise<AttachmentEntity[]> {
    const attachments = files.map(file => {
      const attachment = new AttachmentEntity();
      attachment.originName = file.originalname;
      attachment.fileLength = file.size;
      attachment.extension = file.originalname.split('.').pop();
      attachment.contentType = file.mimetype;
      attachment.businessCode = businessCode;
      attachment.businessId = businessId;
      return attachment;
    });

    return await this.attachmentRepository.save(attachments);
  }

  async findByBusinessId(businessId: string): Promise<AttachmentEntity[]> {
    return await this.attachmentRepository.find({
      where: { businessId },
    });
  }

  async findOne(id: string): Promise<AttachmentEntity> {
    return await this.attachmentRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    attachment: Partial<AttachmentEntity>,
  ): Promise<AttachmentEntity> {
    await this.attachmentRepository.update(id, attachment);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.attachmentRepository.delete(id);
  }
} 