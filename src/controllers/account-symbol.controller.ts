import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Request,
} from '@nestjs/common';
import { AccountSymbolService } from '../services/account-symbol.service';
import { SymbolType } from '../pojo/enums/symbol-type.enum';

@Controller('account/symbol')
export class AccountSymbolController {
  constructor(private readonly accountSymbolService: AccountSymbolService) {}

  @Get('list')
  async findAll(
    @Query('accountBookId') accountBookId: string,
    @Query('symbolType') symbolType: SymbolType,
  ) {
    return await this.accountSymbolService.findAll(accountBookId, symbolType);
  }

  @Post('get-or-create')
  async getOrCreate(
    @Body() body: { name: string; symbolType: SymbolType; accountBookId: string },
    @Request() req,
  ) {
    return await this.accountSymbolService.getOrCreate(
      body.name,
      body.symbolType,
      body.accountBookId,
      req.user.sub,
    );
  }

  @Delete()
  async remove(
    @Query('accountBookId') accountBookId: string,
    @Query('symbolType') symbolType: SymbolType,
    @Query('code') code: string,
  ) {
    await this.accountSymbolService.remove(accountBookId, symbolType, code);
    return { success: true };
  }
}
