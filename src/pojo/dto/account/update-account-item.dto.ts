import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountItemDto } from './create-account-item.dto';

export class UpdateAccountItemDto extends PartialType(CreateAccountItemDto) {}
