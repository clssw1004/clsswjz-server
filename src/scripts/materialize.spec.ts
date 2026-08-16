import { runBackfill } from './materialize';
import { FlushResult } from '../services/materialize.service';

describe('runBackfill', () => {
  it('keeps flushing until a pass materializes nothing', async () => {
    const flush = jest
      .fn<Promise<FlushResult>, []>()
      .mockResolvedValueOnce({ processed: 3, failed: 0 })
      .mockResolvedValueOnce({ processed: 1, failed: 0 })
      .mockResolvedValueOnce({ processed: 0, failed: 0 });
    const materialize = { flush } as any;

    const total = await runBackfill(materialize);

    expect(flush).toHaveBeenCalledTimes(3);
    expect(total).toBe(4);
  });

  it('stops even when failures remain but nothing new is materialized', async () => {
    const flush = jest
      .fn<Promise<FlushResult>, []>()
      .mockResolvedValueOnce({ processed: 2, failed: 1 })
      .mockResolvedValueOnce({ processed: 0, failed: 2 });
    const materialize = { flush } as any;

    const total = await runBackfill(materialize);

    expect(flush).toHaveBeenCalledTimes(2);
    expect(total).toBe(2);
  });

  it('rethrows when flush itself fails', async () => {
    const flush = jest
      .fn<Promise<FlushResult>, []>()
      .mockRejectedValue(new Error('db down'));
    const materialize = { flush } as any;

    await expect(runBackfill(materialize)).rejects.toThrow('db down');
  });
});
