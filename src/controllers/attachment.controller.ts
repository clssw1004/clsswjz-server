import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { AttachmentService } from '../services/attachment.service';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get(':id')
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      const { file, attachment } = await this.attachmentService.getFile(id);

      res.set({
        'Content-Type': attachment.contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          attachment.originName,
        )}"`,
        'Content-Length': attachment.fileLength,
      });

      return new StreamableFile(file);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('文件下载失败');
    }
  }
} 