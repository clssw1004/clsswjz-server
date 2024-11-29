import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountItemDto } from './create-account-item.dto';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemType } from 'src/pojo/enums/item-type.enum';

export class UpdateAccountItemDto {


    @IsOptional()
    @IsString()
    accountBookId?: string;

    @IsOptional()
    id?: string;

    @IsOptional()
    @IsNumber({}, { message: '金额必须是数字' })
    amount?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    type?: ItemType;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsDateString()
    accountDate?: string;
}
