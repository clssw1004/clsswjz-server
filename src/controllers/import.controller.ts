import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from '../services/import.service';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('mint/:accountBookId')
  @UseInterceptors(FileInterceptor('file'))
  async importMintData(
    @Param('accountBookId') accountBookId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'text/csv' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ) {
    return await this.importService.importMintData(
      accountBookId,
      file,
      req.user.sub,
    );
  }
}
