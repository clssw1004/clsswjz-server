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
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from '../services/import.service';
import { ImportDataDto } from '../pojo/dto/import/import-data-dto';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async importMintData(
    @Body() createDto: ImportDataDto,
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
    createDto.file = file;
    return await this.importService.importData(createDto, req.user.sub);
  }
}
