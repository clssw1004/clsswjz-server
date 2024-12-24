import { Column, Entity, Index, Unique } from 'typeorm';
import { SymbolType } from '../enums/symbol-type.enum';
import { BaseAccountNameSymbol } from './basse-account.entity';

@Entity('account_symbols')
@Unique('unique_accountbook_symbol', ['accountBookId', 'symbolType', 'name'])
@Index('index_accountbook_symbol', ['accountBookId', 'symbolType'])
export class AccountSymbol extends BaseAccountNameSymbol {
  @Column({
    length: 64,
    type: 'varchar',
    name: 'symbol_type',
    comment: '类型：TAG-标签，PROJECT-项目',
  })
  symbolType: SymbolType;
}
