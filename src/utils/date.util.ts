import * as dayjs from 'dayjs';

export function now(): number {
  return Date.now();
}

export function nowDateString(): string {
  return formatDate(Date.now());
}

export function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

export function parseTimestamp(dateStr: string): number {
  return dayjs(dateStr).valueOf();
}

export function formatDateToString(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD');
}
