import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ImportSource } from 'src/pojo/enums/import-source.enum';

export class ImportDataDto {
  @IsNotEmpty({ message: '数据来源不能为空' })
  @IsString()
  dataSource: ImportSource;

  @IsNotEmpty({ message: '账本ID不能为空' })
  @IsString()
  accountBookId: string;

  @IsOptional()
  file: Express.Multer.File;
}
