import { Entity, Unique } from 'typeorm';
import { BaseAccountNameSymbol } from './basse-account.entity';
@Entity('account_shops')
@Unique('unique_accountbook_name', ['accountBookId', 'name'])
export class AccountShop extends BaseAccountNameSymbol {}
