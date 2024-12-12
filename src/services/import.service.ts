import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountFund, FundType } from '../pojo/entities/account-fund.entity';
import { User } from '../pojo/entities/user.entity';
import { AccountService } from './account-item.service';
import { AccountFundService } from './account-fund.service';
import { CreateAccountItemDto } from '../pojo/dto/account-item/create-account-item.dto';
import { ItemType } from '../pojo/enums/item-type.enum';
import * as csv from 'csv-parse';
import { Readable } from 'stream';
import * as _ from 'lodash';
import { DEFAULT_FUND } from '../config/default-fund.config';
import { DEFAULT_SHOP } from '../config/default-shop.config';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(AccountFund)
    private accountFundRepository: Repository<AccountFund>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private accountService: AccountService,
    private accountFundService: AccountFundService,
  ) {}

  async importMintData(
    accountBookId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ successCount: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    try {
      // 解析CSV文件
      const records = await this.parseCsvFile(file);

      // 缓存用户和账户信息以减少数据库查询
      const userCache = new Map<string, string>();
      const fundCache = new Map<string, string>();

      // 批量处理记录
      const items: CreateAccountItemDto[] = [];

      for (const record of records) {
        try {
          const item = await this.convertRecordToDto(
            record,
            accountBookId,
            userId,
            userCache,
            fundCache,
          );
          items.push(item);
        } catch (error) {
          errors.push(`行 ${records.indexOf(record) + 1}: ${error.message}`);
        }
      }

      // 批量创建账目
      if (items.length > 0) {
        const result = await this.accountService.createBatch(items, userId);
        successCount = result.successCount;
        if (result.errors) {
          errors.push(...result.errors);
        }
      }

      return { successCount, errors };
    } catch (error) {
      throw new BadRequestException(`导入失败: ${error.message}`);
    }
  }

  private async parseCsvFile(file: Express.Multer.File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const parser = csv.parse({
        delimiter: '\t',
        columns: (headers) => {
          return headers;
        },
        skip_empty_lines: true,
        relaxColumnCount: true,
        relaxColumnCountMore: true,
        quote: '"',
        trim: true,
        encoding: 'utf16le',
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve(records);
      });

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(parser);
    });
  }

  private async convertRecordToDto(
    record: any,
    accountBookId: string,
    userId: string,
    userCache: Map<string, string>,
    fundCache: Map<string, string>,
  ): Promise<CreateAccountItemDto> {
    // 使用 Object.keys 找到正确的键名
    const typeKey = Object.keys(record).find((key) => key.includes('类型'));
    const amountKey = Object.keys(record).find((key) => key.includes('金额'));
    const categoryKey = Object.keys(record).find((key) => key.includes('分类'));
    const fundKey = Object.keys(record).find((key) => key.includes('账户'));
    const shopKey = Object.keys(record).find((key) => key.includes('商家'));
    const dateKey = Object.keys(record).find((key) => key.includes('日期'));
    const authorKey = Object.keys(record).find((key) => key.includes('作者'));
    const remarkKey = Object.keys(record).find((key) => key.includes('备注'));

    if (!typeKey || !amountKey || !categoryKey || !fundKey || !dateKey) {
      throw new Error('CSV文件格式不正确，缺少必要的列');
    }

    // 转换类型
    const type = this.convertType(record[typeKey]);

    // 转换金额
    const amount = Math.abs(parseFloat(record[amountKey]));

    // 获取创建者ID
    const createdBy = await this.getCreatedByUserId(
      authorKey ? record[authorKey] : '',
      userCache,
      userId,
    );

    // 获取账户ID
    const fundId = _.isEmpty(record[fundKey])
      ? DEFAULT_FUND
      : await this.getFundId(
          record[fundKey],
          accountBookId,
          createdBy,
          fundCache,
        );

    // 转换日期
    const accountDate = this.convertDate(record[dateKey]);

    return {
      accountBookId,
      type,
      amount,
      category: record[categoryKey],
      fundId,
      shop: shopKey ? record[shopKey] : DEFAULT_SHOP,
      description: remarkKey ? record[remarkKey] : undefined,
      accountDate,
      createdBy,
    };
  }

  private convertType(type: string): ItemType {
    switch (type) {
      case '支出':
        return ItemType.EXPENSE;
      case '收入':
        return ItemType.INCOME;
      default:
        throw new Error(`不支持的类型: ${type}`);
    }
  }

  private async getCreatedByUserId(
    nickname: string,
    userCache: Map<string, string>,
    defaultUserId: string,
  ): Promise<string> {
    if (!nickname) return defaultUserId;

    // 检查缓存
    if (userCache.has(nickname)) {
      return userCache.get(nickname)!;
    }

    // 查询数据库
    const user = await this.userRepository.findOne({
      where: { nickname },
    });

    const userId = user?.id || defaultUserId;
    userCache.set(nickname, userId);
    return userId;
  }

  private async getFundId(
    fundName: string,
    accountBookId: string,
    userId: string,
    fundCache: Map<string, string>,
  ): Promise<string> {
    const cacheKey = `${accountBookId}:${fundName}`;

    // 检查缓存
    if (fundCache.has(cacheKey)) {
      return fundCache.get(cacheKey)!;
    }

    // 查找现有账户
    let fund = await this.accountFundRepository.findOne({
      where: { name: fundName },
    });

    // 如果账户不存在，创建新账户
    if (!fund) {
      const createFundDto = {
        name: fundName,
        fundType: FundType.CASH,
        fundBalance: 0,
        fundRemark: '从薄荷记账导入',
      };

      fund = await this.accountFundService.create(createFundDto, userId);

      // 关联到账本
      await this.accountFundService.update(
        fund.id,
        {
          fundBooks: [
            {
              accountBookId,
              fundIn: true,
              fundOut: true,
              isDefault: false,
            },
          ],
        },
        userId,
      );
    }

    fundCache.set(cacheKey, fund.id);
    return fund.id;
  }

  private convertDate(dateStr: string): string {
    return `${dateStr}:00`;
  }
}
