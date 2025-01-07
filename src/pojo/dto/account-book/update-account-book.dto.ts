import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../enums/currency.enum';

export class UpdateAccountBookMemberDto {
  @ApiProperty({
    description: '用户ID',
    example: 'user123',
  })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '查看账本权限',
    example: true,
  })
  @IsNotEmpty()
  canViewBook: boolean;

  @ApiProperty({
    description: '编辑账本权限',
    example: true,
  })
  @IsNotEmpty()
  canEditBook: boolean;

  @ApiProperty({
    description: '删除账本权限',
    example: false,
  })
  @IsNotEmpty()
  canDeleteBook: boolean;

  @ApiProperty({
    description: '查看账目权限',
    example: true,
  })
  @IsNotEmpty()
  canViewItem: boolean;

  @ApiProperty({
    description: '编辑账目权限',
    example: true,
  })
  @IsNotEmpty()
  canEditItem: boolean;

  @ApiProperty({
    description: '删除账目权限',
    example: false,
  })
  @IsNotEmpty()
  canDeleteItem: boolean;
}

export class UpdateAccountBookDto {
  @ApiProperty({
    description: '账本ID',
    example: 'book123',
  })
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: '账本名称',
    example: '日常开支',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: '账本描述',
    example: '记录日常生活开支',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '货币符号',
    enum: Currency,
    example: Currency.CNY,
  })
  @IsNotEmpty()
  @IsEnum(Currency)
  currencySymbol: Currency;

  @ApiProperty({
    description: '账本图标',
    example: 'wallet',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    description: '账本成员权限列表',
    type: [UpdateAccountBookMemberDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAccountBookMemberDto)
  members: UpdateAccountBookMemberDto[];
}
