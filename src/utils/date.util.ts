import * as dayjs from 'dayjs';
export function now(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}
