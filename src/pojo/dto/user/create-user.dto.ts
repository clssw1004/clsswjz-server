import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  Length,
  Matches,
  IsEnum,
} from 'class-validator';
import { Language } from '../../enums/language.enum';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @Length(2, 50, { message: '用户名长度必须在2-50个字符之间' })
  username: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(6, 50, { message: '密码长度必须在6-50个字符之间' })
  password: string;

  @IsOptional()
  @IsString()
  @Length(2, 50, { message: '昵称长度必须在2-50个字符之间' })
  nickname?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsEnum(Language, { message: '语言设置不正确' })
  language?: Language;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]+\/[A-Za-z_]+$/, { message: '时区格式不正确' })
  timezone?: string;
} 