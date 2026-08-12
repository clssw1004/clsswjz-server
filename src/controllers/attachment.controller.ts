import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Request,
  NotFoundException,
  ForbiddenException,
  StreamableFile,
  Header,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { Response } from 'express';
import { AttachmentService } from '../services/attachment.service';
import { SkipInterceptors } from '../decorators/skip-interceptors.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post('upload')
  @ApiOperation({ summary: '批量上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 }), // 10MB
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    const results = await this.attachmentService.uploadFiles(files);
    return {
      fileIds: results,
    };
  }

  @Get(':id')
  @Header('Accept-Ranges', 'bytes')
  @SkipInterceptors()
  async downloadFile(
    @Param('id') id: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // 数据隔离：需登录，且请求者须是附件归属账本的成员（或附件本人）
    const allowed = await this.attachmentService.authorizeDownload(
      id,
      req.user.sub,
    );
    if (!allowed) {
      throw new ForbiddenException('无权下载该附件');
    }
    try {
      const { file } = await this.attachmentService.getRawFile(id);

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
          id,
        )}`,
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
