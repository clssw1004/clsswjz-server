import { IsOptional, IsString, Length, Matches, IsEnum } from 'class-validator';
import { Language } from '../../enums/language.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: '昵称长度必须在2-50个字符之间' })
  nickname?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Language, { message: '语言设置不正确' })
  language?: Language;

  @IsOptional()
  @IsString()
  timezone?: string;
}
