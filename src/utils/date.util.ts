import * as dayjs from 'dayjs';
export function now(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD');
}
