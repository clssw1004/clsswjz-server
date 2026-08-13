import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MaterializeService } from '../services/materialize.service';

/**
 * 循环调用 flush 直到一轮没有新日志被回放为止。
 * 抽成纯函数便于单测：传入任意具备 flush() 的服务即可。
 * @returns 本轮回放累计处理（含跳过）的日志数
 */
export async function runBackfill(
  materialize: {
    flush(opts?: {
      limit?: number;
    }): Promise<{ processed: number; failed: number }>;
  },
  log: (message: string) => void = console.log,
): Promise<number> {
  let round = 0;
  let totalProcessed = 0;
  while (true) {
    round++;
    const { processed, failed } = await materialize.flush();
    totalProcessed += processed;
    log(`第 ${round} 轮回放：processed=${processed}, failed=${failed}`);
    // 一轮没有新日志被落库（全部失败/无可处理）时停止，避免死循环
    if (processed === 0) {
      break;
    }
  }
  return totalProcessed;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const materializeService = app.get(MaterializeService);

  // --reset：重头回放。先清空业务表 + 清除回放标记，再从日志完整重建。
  // 适用于业务表结构变更 / 回放逻辑升级 / 需要推倒重建业务数据。
  if (process.argv.includes('--reset')) {
    console.log('重头回放：清空业务表并清除回放标记...');
    await materializeService.reset();
    console.log('业务数据已清空，开始从日志完整重建...');
  }

  const total = await runBackfill(materializeService);
  console.log(`存量日志回放完成，共回放 ${total} 条`);
  await app.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('存量日志回放失败:', error);
    process.exit(1);
  });
}
