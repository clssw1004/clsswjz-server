import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  AttachmentEntity,
  BusinessCode,
} from '../pojo/entities/attachment.entity';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

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

  // 写入文件并返回文件ID
  private async writeFile(
    file: Buffer | Express.Multer.File,
    fileName: string,
  ): Promise<void> {
    const filePath = path.join(this.attachmentPath, fileName);
    const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;

    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(fileBuffer);
      writeStream.end();
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });
  }

  async uploadFiles(files: Express.Multer.File[]): Promise<void> {
    for (const file of files) {
      await this.writeFile(file, file.originalname);
    }
  }

  async createBatch(
    businessCode: BusinessCode,
    businessId: string,
    files: Express.Multer.File[],
    userId: string,
    transactionalEntityManager?: EntityManager,
  ): Promise<AttachmentEntity[]> {
    const attachments = [];
    for (const file of files) {
      const attachment = new AttachmentEntity();
      attachment.originName = file.originalname;
      attachment.fileLength = file.size;
      attachment.extension = file.originalname.split('.').pop();
      attachment.contentType = file.mimetype;
      attachment.businessCode = businessCode;
      attachment.businessId = businessId;
      attachment.createdBy = userId;
      attachment.updatedBy = userId;

      const savedAttachment = transactionalEntityManager
        ? await transactionalEntityManager.save(AttachmentEntity, attachment)
        : await this.attachmentRepository.save(attachment);

      // 使用提取的写文件方法
      await this.writeFile(file, savedAttachment.id);
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

  async getRawFile(id: string): Promise<{
    file: Readable;
  }> {
    const filePath = path.join(this.attachmentPath, id);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('附件文件不存在');
    }

    // 使用 createReadStream 创建文件流而不是直接读取整个文件
    const file = createReadStream(filePath);
    return { file };
  }

  async getFile(id: string): Promise<{
    file: Readable;
    attachment: AttachmentEntity;
  }> {
    const attachment = await this.findOne(id);
    const filePath = path.join(this.attachmentPath, id);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('附件文件不存在');
    }

    // 使用 createReadStream 创建文件流而不是直接读取整个文件
    const file = createReadStream(filePath);
    return { file, attachment };
  }

  async remove(id: string): Promise<void> {
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

  async removeByIds(
    ids: string[],
    transactionalEntityManager?: EntityManager,
  ): Promise<void> {
    if (transactionalEntityManager) {
      await transactionalEntityManager.delete(AttachmentEntity, {
        id: In(ids),
      });
    } else {
      await this.attachmentRepository.delete({ id: In(ids) });
    }
  }
}
