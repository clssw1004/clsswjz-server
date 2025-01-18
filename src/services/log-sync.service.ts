import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, MoreThan, Repository } from 'typeorm';
import { LogSync } from '../pojo/entities/log-sync.entity';
import { SyncState } from '../pojo/enums/sync-state.enum';
import { now } from '../utils/date.util';
import { SyncService } from './sync.service';
import { BusinessType } from 'src/pojo/enums/business-type.enum';
import { OperateType } from 'src/pojo/enums/operate-type.enum';
import { CreateUserDto } from 'src/pojo/dto/user/create-user.dto';
import { UserService } from './user.service';
import { TokenService } from './token.service';
import {
  LogResult,
  RegisterSyncDto,
  SyncResult,
} from 'src/pojo/dto/log-sync/sync.dto';

@Injectable()
export class LogSyncService {
  constructor(
    @InjectRepository(LogSync)
    private readonly logSyncRepository: Repository<LogSync>,
    private readonly syncService: SyncService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async syncRegister(registerLog: RegisterSyncDto) {
    const log = registerLog.log;
    // 1. 获取用户信息
    const userCreateDto = JSON.parse(log.operateData) as CreateUserDto;

    // 2. 创建用户
    const newUser = await this.userService.create(userCreateDto);

    // 3. 签发token
    const token = await this.tokenService.generateToken(newUser.id, {
      ...userCreateDto,
      clientType: registerLog.clientType,
      clientId: registerLog.clientId,
      clientName: registerLog.clientName,
    });
    // 4. 返回结果
    return {
      token,
      user: newUser,
    };
  }

  /**
   * 处理单条日志
   * @param log 日志对象
   * @param currentTime 当前时间戳
   * @param shouldRunSync 是否执行同步操作
   * @returns 处理结果
   */
  private async processLog(
    log: LogSync,
    currentTime: number,
  ): Promise<LogResult> {
    try {
      // 需要执行同步操作
      await this.logSyncRepository.manager.transaction(
        async (transactionalEntityManager) => {
          log.syncTime = currentTime;
          log.syncState = SyncState.SYNCED;
          await this.syncService.runLogSync(log, transactionalEntityManager);
          await transactionalEntityManager.save(LogSync, log);
        },
      );

      return LogResult.success(log);
    } catch (error) {
      // 处理失败
      log.syncState = SyncState.FAILED;
      log.syncError = error.message;
      log.syncTime = currentTime;
      await this.logSyncRepository.save(log);
      return LogResult.error(log, error.message);
    }
  }

  /**
   * 同步数据
   * @param logs 客户端日志列表
   * @param userId 用户ID
   * @param lastSyncTime 最后同步时间
   * @param shouldRunSync 是否执行同步操作
   * @param shouldFetchChanges 是否获取服务器变更
   * @returns 同步结果
   */
  async sync(
    logs: LogSync[] = [],
    userId: string,
    lastSyncTime?: number,
    shouldFetchChanges = true,
  ): Promise<SyncResult> {
    const currentTime = now();

    // 1. 处理客户端上传的日志
    const results =
      logs.length > 0
        ? await Promise.all(
            logs.map((log) => this.processLog(log, currentTime)),
          )
        : [];

    // 2. 获取服务器端变更（其他设备上传的日志）
    const changes = shouldFetchChanges
      ? await this.logSyncRepository.find({
          where: {
            operatorId: userId,
            syncState: SyncState.SYNCED,
            ...(lastSyncTime && { syncTime: MoreThan(lastSyncTime) }),
            ...(logs.length > 0 && { id: Not(In(logs.map((log) => log.id))) }),
          },
          order: {
            operatedAt: 'ASC',
          },
        })
      : logs;
    await this.desensitize(changes, userId);
    // 3. 返回结果
    return {
      results,
      changes,
      syncTimeStamp: currentTime,
    };
  }

  private async desensitize(logs: LogSync[], userId: string) {
    return logs.forEach((log) => {
      // 如果不是用户相关的日志或者操作人是当前用户,直接返回原始日志
      if (log.businessType !== BusinessType.USER || log.operatorId === userId) {
        return;
      }

      // 只处理新增和更新操作
      if (![OperateType.CREATE, OperateType.UPDATE].includes(log.operateType)) {
        return;
      }

      // 解析操作数据
      const operateData = JSON.parse(log.operateData);

      // 脱敏敏感信息
      if (operateData.password) {
        delete operateData.password;
      }
      if (operateData.phone) {
        operateData.phone = '***********';
      }
      if (operateData.email) {
        operateData.email = `*******@*******`;
      }

      // 更新操作数据
      log.operateData = JSON.stringify(operateData);
      return log;
    });
  }
}
