import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { AttachmentService } from '../services/attachment.service';
import { Public } from 'src/decorators/public';
import { SkipInterceptors } from 'src/decorators/skip-interceptors.decorator';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get(':id')
  @Public()
  @Header('Accept-Ranges', 'bytes')
  @SkipInterceptors()
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    try {
      const { file, attachment } = await this.attachmentService.getFile(id);

      res.set({
        'Content-Type': attachment.contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
          attachment.originName,
        )}`,
        'Content-Length': attachment.fileLength,
        'Cache-Control': 'no-cache',
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