import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Currency } from '../../enums/currency.enum';

export class UpdateAccountBookMemberDto {
    @IsNotEmpty()
    @IsUUID()
    userId: string;

    @IsNotEmpty()
    canViewBook: boolean;

    @IsNotEmpty()
    canEditBook: boolean;

    @IsNotEmpty()
    canDeleteBook: boolean;

    @IsNotEmpty()
    canViewItem: boolean;

    @IsNotEmpty()
    canEditItem: boolean;

    @IsNotEmpty()
    canDeleteItem: boolean;
}

export class UpdateAccountBookDto {
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsEnum(Currency)
    currencySymbol: Currency;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAccountBookMemberDto)
    members: UpdateAccountBookMemberDto[];
}
