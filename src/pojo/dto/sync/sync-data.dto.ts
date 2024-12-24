import { Type } from 'class-transformer';
import { IsDateString, IsOptional, ValidateNested } from 'class-validator';
import { AccountBook } from '../../entities/account-book.entity';
import { AccountCategory } from '../../entities/account-category.entity';
import { AccountItem } from '../../entities/account-item.entity';
import { AccountShop } from '../../entities/account-shop.entity';
import { AccountSymbol } from '../../entities/account-symbol.entity';
import { AccountFund } from '../../entities/account-fund.entity';
import { AccountBookFund } from '../../entities/account-book-fund.entity';
import { AccountBookUser } from '../../entities/account-book-user.entity';

export class SyncChangesDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountBook)
  accountBooks?: AccountBook[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountCategory)
  accountCategories?: AccountCategory[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountItem)
  accountItems?: AccountItem[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountShop)
  accountShops?: AccountShop[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountSymbol)
  accountSymbols?: AccountSymbol[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountFund)
  accountFunds?: AccountFund[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountBookFund)
  accountBookFunds?: AccountBookFund[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccountBookUser)
  accountBookUsers?: AccountBookUser[];
}

export class SyncDataDto {
  @IsDateString()
  lastSyncTime: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SyncChangesDto)
  changes?: SyncChangesDto;
}
