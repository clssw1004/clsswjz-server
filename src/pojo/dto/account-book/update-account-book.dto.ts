import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountBookDto } from './create-account-book.dto';

export class UpdateAccountBookDto extends PartialType(CreateAccountBookDto) {}
