import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AttachmentEntity, BusinessCode } from '../pojo/entities/attachment.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentService {
  private attachmentPath: string;

  constructor(
    @InjectRepository(AttachmentEntity)
    private attachmentRepository: Repository<AttachmentEntity>,
    private configService: ConfigService,
  ) {
    // 初始化附件存储路径
    const dataPath = this.configService.get('DATA_PATH', '/data');
    this.attachmentPath = path.join(dataPath, 'attachments');
    this.ensureAttachmentDir();
  }

  // 确保附件目录存在
  private ensureAttachmentDir() {
    if (!fs.existsSync(this.attachmentPath)) {
      fs.mkdirSync(this.attachmentPath, { recursive: true });
    }
  }


  async createBatch(
    businessCode: BusinessCode,
    businessId: string,
    files: Express.Multer.File[],
    userId: string,
  ): Promise<AttachmentEntity[]> {
    const attachments = [];

    for (const file of files) {
      // 创建附件记录
      const attachment = new AttachmentEntity();
      attachment.originName = file.originalname;
      attachment.fileLength = file.size;
      attachment.extension = file.originalname.split('.').pop();
      attachment.contentType = file.mimetype;
      attachment.businessCode = businessCode;
      attachment.businessId = businessId;
      attachment.createdBy = userId;
      attachment.updatedBy = userId;

      // 保存附件记录
      const savedAttachment = await this.attachmentRepository.save(attachment);

      // 将文件保存到本地
      const filePath = path.join(this.attachmentPath, savedAttachment.id);
      fs.writeFileSync(filePath, file.buffer);

      attachments.push(savedAttachment);
    }

    return attachments;
  }

  async findByBusinessId(businessId: string): Promise<AttachmentEntity[]> {
    return await this.attachmentRepository.find({
      where: { businessId },
    });
  }

  async findOne(id: string): Promise<AttachmentEntity> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }

    return attachment;
  }

  async getFile(id: string): Promise<{ file: Buffer; attachment: AttachmentEntity }> {
    const attachment = await this.findOne(id);
    const filePath = path.join(this.attachmentPath, id);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('附件文件不存在');
    }

    const file = fs.readFileSync(filePath);
    return { file, attachment };
  }


  async remove(id: string): Promise<void> {
    const attachment = await this.findOne(id);
    
    // 删除文件
    const filePath = path.join(this.attachmentPath, id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await this.attachmentRepository.delete(id);
  }

  async findByBusinessIds(businessIds: string[]): Promise<AttachmentEntity[]> {
    if (!businessIds.length) return [];
    
    return await this.attachmentRepository.find({
      where: { businessId: In(businessIds) },
    });
  }
} 