import * as path from 'path';
import * as fs from 'fs';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SyncState } from '../src/pojo/enums/sync-state.enum';

// 测试库：临时 SQLite 文件（process.env 在编译模块前设置，覆盖 .env）
const TEST_DB = path.join(__dirname, '.e2e-test.sqlite');
process.env.DB_TYPE = 'sqlite';
process.env.DB_HOST = '';
process.env.DB_PORT = '';
process.env.DB_USERNAME = '';
process.env.DB_PASSWORD = '';
process.env.DB_DATABASE = TEST_DB;
process.env.DB_FORCE_SYNC = 'true';
process.env.DATA_PATH = path.join(__dirname, '.e2e-test-data');

describe('Sync 数据隔离 (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let seq = 0;

  function cleanDbFiles() {
    for (const f of [
      TEST_DB,
      TEST_DB + '-journal',
      TEST_DB + '-wal',
      TEST_DB + '-shm',
    ]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }

  beforeAll(async () => {
    cleanDbFiles();
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    cleanDbFiles();
  });

  async function register(
    username: string,
  ): Promise<{ token: string; userId: string }> {
    const res = await request(server)
      .post('/api/sync/register')
      .send({
        username,
        password: 'secret123',
        nickname: username,
        clientType: 'e2e',
        clientId: 'e2e',
        clientName: 'e2e',
      })
      .expect(201);
    const data = res.body.data;
    return { token: data.access_token, userId: data.userId };
  }

  function nextLogId(): string {
    return `e2e-log-${Date.now()}-${seq++}`;
  }

  function bookCreateLog(bookId: string, operatorId: string, at: number) {
    return {
      id: nextLogId(),
      businessType: 'book',
      operateType: 'create',
      parentType: 'book',
      parentId: bookId,
      operatorId,
      operatedAt: at,
      businessId: bookId,
      operateData: JSON.stringify({
        id: bookId,
        name: `账本${bookId}`,
        createdBy: operatorId,
        updatedBy: operatorId,
        createdAt: at,
        updatedAt: at,
      }),
      syncState: SyncState.UNSYNCED,
      syncTime: -1,
    };
  }

  function bookMemberLog(
    relId: string,
    bookId: string,
    inviterId: string,
    memberId: string,
    operateType: 'create' | 'delete',
    at: number,
  ) {
    return {
      id: nextLogId(),
      businessType: 'bookMember',
      operateType,
      parentType: 'book',
      parentId: bookId,
      operatorId: inviterId,
      operatedAt: at,
      businessId: relId,
      operateData:
        operateType === 'create'
          ? JSON.stringify({
              id: relId,
              userId: memberId,
              accountBookId: bookId,
              canViewBook: true,
              canViewItem: true,
              createdAt: at,
              updatedAt: at,
            })
          : JSON.stringify({ userId: memberId, accountBookId: bookId }),
      syncState: SyncState.UNSYNCED,
      syncTime: -1,
    };
  }

  async function push(token: string, logs: any[]) {
    const res = await request(server)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({ logs, syncTimeStamp: 0 });
    return res.body.data;
  }

  async function pull(token: string, syncTimeStamp = 0) {
    const res = await request(server)
      .post('/api/sync/pull')
      .set('Authorization', `Bearer ${token}`)
      .send({ syncTimeStamp, page: 1, pageSize: 100 });
    return res.body.data;
  }

  async function pullBackfill(
    token: string,
    backfillOwnerId: string,
    backfillBusinessTypes: string[],
  ) {
    const res = await request(server)
      .post('/api/sync/pull')
      .set('Authorization', `Bearer ${token}`)
      .send({
        syncTimeStamp: 999999, // 故意设大，验证回溯不受时间过滤
        page: 1,
        pageSize: 100,
        backfillOwnerId,
        backfillBusinessTypes,
      });
    return res.body.data;
  }

  it('注册两个用户并隔离：B 拉取不到 A 的账本数据', async () => {
    const a = await register('e2e_a');
    const b = await register('e2e_b');

    // A 创建账本 eb1
    const pushRes = await push(a.token, [bookCreateLog('eb1', a.userId, 1000)]);
    expect(pushRes.results[0].syncState).toBe(SyncState.SYNCED);

    // B 拉取：不应看到 eb1
    const bPull = await pull(b.token);
    expect(
      bPull.changes.some(
        (c: any) => c.businessType === 'book' && c.businessId === 'eb1',
      ),
    ).toBe(false);
  });

  it('用他人 operatorId 伪造日志会被拒绝', async () => {
    const a = await register('e2e_a2');
    const b = await register('e2e_b2');

    // 用 A 的 token 推送，但日志 operatorId 写 B（冒充 B）
    const spoof = bookCreateLog('eb2', a.userId, 2000);
    const pushRes = await push(a.token, [
      { ...spoof, id: nextLogId(), operatorId: b.userId },
    ]);
    expect(pushRes.results[0].syncState).toBe(SyncState.FAILED);
    expect(pushRes.results[0].syncError).toContain('operatorId');
  });

  it('共享账本：被邀请的 B 能拉到账本数据，被移除后收通知且不再见数据', async () => {
    const a = await register('e2e_a3');
    const b = await register('e2e_b3');

    // A 建账本 + 邀请 B
    await push(a.token, [bookCreateLog('eb3', a.userId, 1000)]);
    await push(a.token, [
      bookMemberLog('rel-eb3-b', 'eb3', a.userId, b.userId, 'create', 2000),
    ]);

    // B 拉取：能看到 eb3（成员关系已落库）
    const bPull1 = await pull(b.token);
    expect(
      bPull1.changes.some(
        (c: any) => c.businessType === 'book' && c.businessId === 'eb3',
      ),
    ).toBe(true);

    // A 移除 B
    await push(a.token, [
      bookMemberLog('rel-eb3-b', 'eb3', a.userId, b.userId, 'delete', 3000),
    ]);

    // B 拉取：收到"自己被移除"的日志，但不再有 eb3 的账本数据
    const bPull2 = await pull(b.token);
    expect(
      bPull2.changes.some(
        (c: any) =>
          c.businessType === 'bookMember' && c.operateType === 'delete',
      ),
    ).toBe(true);
    expect(
      bPull2.changes.some(
        (c: any) => c.businessType === 'book' && c.businessId === 'eb3',
      ),
    ).toBe(false);

    // B 再向 eb3 推送（bookMember 作用域）被拒绝（已不是成员）
    const rejectRes = await push(b.token, [
      bookMemberLog('rel-eb3-b2', 'eb3', b.userId, b.userId, 'create', 4000),
    ]);
    expect(rejectRes.results[0].syncState).toBe(SyncState.FAILED);
    expect(rejectRes.results[0].syncError).toContain('无权');
  });

  // ── userShare 共享数据可见性测试 ──

  function userShareCreateLog(
    shareId: string,
    ownerUserId: string,
    targetUserId: string,
    businessType: string,
    at: number,
  ) {
    return {
      id: nextLogId(),
      businessType: 'userShare',
      operateType: 'create',
      parentType: 'root',
      parentId: '',
      operatorId: ownerUserId,
      operatedAt: at,
      businessId: shareId,
      operateData: JSON.stringify({
        id: shareId,
        ownerUserId,
        targetUserId,
        businessType,
        isEnabled: true,
        createdAt: at,
        updatedAt: at,
      }),
      syncState: SyncState.UNSYNCED,
      syncTime: -1,
    };
  }

  /** noParent() 业务日志（模拟 periodCycle 等扩展模块） */
  function noParentBusinessLog(
    bizId: string,
    operatorId: string,
    businessType: string,
    at: number,
  ) {
    return {
      id: nextLogId(),
      businessType,
      operateType: 'create',
      parentType: 'root',
      parentId: '',
      operatorId,
      operatedAt: at,
      businessId: bizId,
      operateData: JSON.stringify({
        id: bizId,
        startDate: '2026-08-01',
        createdBy: operatorId,
        updatedBy: operatorId,
        createdAt: at,
        updatedAt: at,
      }),
      syncState: SyncState.UNSYNCED,
      syncTime: -1,
    };
  }

  function userProfileLog(
    userId: string,
    nickname: string,
    at: number,
  ) {
    return {
      id: nextLogId(),
      businessType: 'user',
      operateType: 'create',
      parentType: 'root',
      parentId: '',
      operatorId: userId,
      operatedAt: at,
      businessId: userId,
      operateData: JSON.stringify({
        id: userId,
        username: 'secret',
        nickname,
        createdAt: at,
        updatedAt: at,
      }),
      syncState: SyncState.UNSYNCED,
      syncTime: -1,
    };
  }

  it('userShare：A 分享给 B 后，B 能拉到 userShare 日志', async () => {
    const a = await register('e2e_share_a');
    const b = await register('e2e_share_b');

    // A 推送 userShare（分享 periodCycle 给 B）
    const pushRes = await push(a.token, [
      userShareCreateLog('share-1', a.userId, b.userId, 'periodCycle', 1000),
    ]);
    expect(pushRes.results[0].syncState).toBe(SyncState.SYNCED);

    // B 拉取：应能看到该 userShare 日志
    const bPull = await pull(b.token);
    expect(
      bPull.changes.some(
        (c: any) =>
          c.businessType === 'userShare' && c.businessId === 'share-1',
      ),
    ).toBe(true);
  });

  it('userShare：A 分享后，B 能拉到 A 的 noParent() 业务日志', async () => {
    const a = await register('e2e_share_a2');
    const b = await register('e2e_share_b2');

    // A 推送 userShare + noParent 业务日志
    await push(a.token, [
      userShareCreateLog('share-2', a.userId, b.userId, 'periodCycle', 1000),
      noParentBusinessLog('biz-pc-1', a.userId, 'periodCycle', 2000),
    ]);

    // B 拉取：应能看到 A 的 periodCycle 业务日志
    const bPull = await pull(b.token);
    expect(
      bPull.changes.some(
        (c: any) =>
          c.businessType === 'periodCycle' && c.businessId === 'biz-pc-1',
      ),
    ).toBe(true);
  });

  it('userShare：无共同账本时，B 能拉到 A 的 USER 资料日志', async () => {
    const a = await register('e2e_share_a3');
    const b = await register('e2e_share_b3');

    // A 推送 userShare + USER 资料日志（A 和 B 无共同账本）
    await push(a.token, [
      userShareCreateLog('share-3', a.userId, b.userId, 'periodCycle', 1000),
      userProfileLog(a.userId, '用户A', 2000),
    ]);

    // B 拉取：应能看到 A 的 USER 资料（用于昵称翻译）
    const bPull = await pull(b.token);
    expect(
      bPull.changes.some(
        (c: any) =>
          c.businessType === 'user' && c.operatorId === a.userId,
      ),
    ).toBe(true);
  });

  it('userShare：A 未分享给 B 时，B 拉不到 A 的 noParent() 日志', async () => {
    const a = await register('e2e_share_a4');
    const b = await register('e2e_share_b4');

    // A 推送 noParent 业务日志（但不推送 userShare）
    await push(a.token, [
      noParentBusinessLog('biz-pc-2', a.userId, 'periodCycle', 1000),
    ]);

    // B 拉取：不应看到 A 的 periodCycle 日志
    const bPull = await pull(b.token);
    expect(
      bPull.changes.some(
        (c: any) =>
          c.businessType === 'periodCycle' && c.businessId === 'biz-pc-2',
      ),
    ).toBe(false);
  });

  // ── 回溯拉取测试 ──

  it('回溯拉取：有 userShare 关系时，B 能回溯拉取 A 的全部历史日志', async () => {
    const a = await register('e2e_backfill_a');
    const b = await register('e2e_backfill_b');

    // A 推送多条历史日志（时间戳都在过去）
    await push(a.token, [
      userShareCreateLog('share-bf-1', a.userId, b.userId, 'periodCycle', 1000),
      noParentBusinessLog('biz-pc-bf-1', a.userId, 'periodCycle', 2000),
      noParentBusinessLog('biz-pc-bf-2', a.userId, 'periodCycle', 3000),
      userProfileLog(a.userId, '回溯用户A', 4000),
    ]);

    // B 正常增量拉取（syncTimeStamp 设为极大值，所有日志的 sync_time 都小于它）→ 增量模式拉不到
    const normalPull = await pull(b.token, 9999999999999999);
    expect(
      normalPull.changes.some(
        (c: any) => c.businessType === 'periodCycle',
      ),
    ).toBe(false);

    // B 回溯拉取（无时间过滤）→ 能拉到 A 的全部 periodCycle 历史 + USER 资料
    const backfillPull = await pullBackfill(b.token, a.userId, ['periodCycle']);
    expect(
      backfillPull.changes.filter(
        (c: any) => c.businessType === 'periodCycle',
      ).length,
    ).toBe(2); // 2 条 periodCycle 业务日志（不含 userShare）
    expect(
      backfillPull.changes.some(
        (c: any) =>
          c.businessType === 'user' && c.operatorId === a.userId,
      ),
    ).toBe(true); // USER 资料自动包含
  });

  it('回溯拉取：无 userShare 关系时，B 无法回溯 A 的数据', async () => {
    const a = await register('e2e_backfill_a2');
    const b = await register('e2e_backfill_b2');

    // A 推送日志但不建立分享关系
    await push(a.token, [
      noParentBusinessLog('biz-pc-bf-3', a.userId, 'periodCycle', 1000),
    ]);

    // B 尝试回溯 → 被拒绝
    const backfillPull = await pullBackfill(b.token, a.userId, ['periodCycle']);
    expect(backfillPull.changes.length).toBe(0);
    expect(backfillPull.total).toBe(0);
  });

  it('回溯拉取：只返回指定业务类型的历史日志', async () => {
    const a = await register('e2e_backfill_a3');
    const b = await register('e2e_backfill_b3');

    await push(a.token, [
      userShareCreateLog('share-bf-3', a.userId, b.userId, 'vehicle', 1000),
      noParentBusinessLog('biz-v-1', a.userId, 'vehicle', 2000),
      noParentBusinessLog('biz-pc-bf-4', a.userId, 'periodCycle', 3000),
    ]);

    // 只回溯 vehicle 类型
    const backfillPull = await pullBackfill(b.token, a.userId, ['vehicle']);
    expect(
      backfillPull.changes.some(
        (c: any) => c.businessType === 'vehicle' && c.businessId === 'biz-v-1',
      ),
    ).toBe(true);
    // periodCycle 不应出现
    expect(
      backfillPull.changes.some(
        (c: any) =>
          c.businessType === 'periodCycle' && c.businessId === 'biz-pc-bf-4',
      ),
    ).toBe(false);
  });
});
