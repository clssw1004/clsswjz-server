import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../pojo/entities/user.entity';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { AccountBook } from '../pojo/entities/account-book.entity';
import { AccountBookUser } from '../pojo/entities/account-book-user.entity';
import { now } from '../utils/date.util';

/**
 * 管理台服务：管理员登录 + 运维查询（用户/日志/概览）。
 * 与普通用户 token 体系隔离，管理员为环境变量配置的独立账号。
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    @InjectRepository(AccountBook)
    private readonly accountBookRepository: Repository<AccountBook>,
    @InjectRepository(AccountBookUser)
    private readonly accountBookUserRepository: Repository<AccountBookUser>,
  ) {}

  /** 管理员登录：比对 env 账号密码，签发 role=admin 的 JWT */
  async login(username: string, password: string) {
    const adminUser = this.configService.get<string>('ADMIN_USERNAME', 'admin');
    const adminPass = this.configService.get<string>('ADMIN_PASSWORD', '');
    if (username !== adminUser || password !== adminPass) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }
    const accessToken = await this.jwtService.signAsync({
      sub: 'admin',
      role: 'admin',
    });
    const decoded = this.jwtService.decode(accessToken) as any;
    return {
      access_token: accessToken,
      expires_in: decoded.exp - decoded.iat,
    };
  }

  /** 平台概览：用户/日志总量、同步状态分布、近 7 日活跃用户、今日推送量 */
  async overview() {
    const totalUsers = await this.userRepository.count();
    const totalLogs = await this.logSyncRepository.count();

    const distributionRows = await this.logSyncRepository
      .createQueryBuilder('log')
      .select('log.syncState', 'state')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.syncState')
      .getRawMany();
    const syncStateDistribution: Record<string, number> = {};
    for (const row of distributionRows) {
      syncStateDistribution[row.state] = Number(row.count);
    }

    const activeRow = await this.logSyncRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.operatorId)', 'count')
      .where('log.sync_time >= :threshold', {
        threshold: now() - 7 * 24 * 3600 * 1000,
      })
      .getRawOne();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayPushCount = await this.logSyncRepository.count({
      where: { syncTime: MoreThanOrEqual(startOfToday.getTime()) },
    });

    return {
      totalUsers,
      totalLogs,
      syncStateDistribution,
      activeUsers7d: Number(activeRow?.count ?? 0),
      todayPushCount,
    };
  }

  /** 用户分页列表，附带每人日志数与最近同步时间（不返回密码等敏感字段） */
  async listUsers(params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }) {
    const qb = this.userRepository.createQueryBuilder('user');
    if (params.keyword) {
      qb.where('user.username LIKE :kw OR user.nickname LIKE :kw', {
        kw: `%${params.keyword}%`,
      });
    }
    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((params.page - 1) * params.pageSize)
      .take(params.pageSize)
      .getManyAndCount();

    const items = [];
    for (const user of users) {
      const stats = await this.logSyncRepository
        .createQueryBuilder('log')
        .select('COUNT(*)', 'logCount')
        .addSelect('MAX(log.syncTime)', 'lastSyncTime')
        .where('log.operatorId = :uid', { uid: user.id })
        .getRawOne();
      items.push({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        createdAt: user.createdAt,
        logCount: Number(stats?.logCount ?? 0),
        lastSyncTime: stats?.lastSyncTime ?? null,
      });
    }

    return { items, total, page: params.page, pageSize: params.pageSize };
  }
}
