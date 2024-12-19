import { Entity, Unique } from 'typeorm';
import { BaseAccountNameSymbol } from './basse-account.entity';
@Entity('account_shops')
@Unique(['accountBookId', 'name'])
export class AccountShop extends BaseAccountNameSymbol {}
