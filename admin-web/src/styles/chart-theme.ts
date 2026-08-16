/**
 * ECharts 主题 — 明暗双套（dark/light），所有图表统一引用保证视觉一致。
 * 直接传给 echarts.init(el, theme)，无需 registerTheme。
 * 图表实例不随明暗重建；颜色由 option 通过 chartDefaults()/chartPalette() 显式覆盖。
 */
import { mode } from './themes';

export type ChartTheme = Record<string, unknown>;
export type ChartMode = 'dark' | 'light';

/** 系列色板（明暗共用，8 色：琥珀金→紫→绿→青→红→浅紫→黄→翠绿） */
/** 系列色板（明暗共用，8 色：琥珀金→紫→绿→青→红→浅紫→黄→翠绿） */
const COLOR_PALETTE = [
  '#f59e0b',
  '#8b5cf6',
  '#10b981',
  '#06b6d4',
  '#f43f5e',
  '#a78bfa',
  '#fbbf24',
  '#34d399',
];

export const darkChartTheme: ChartTheme = {
  color: COLOR_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    color: '#a5b4c8',
    fontFamily: "'Fira Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  title: {
    textStyle: { color: '#f1f5f9', fontSize: 15, fontWeight: 600 },
    subtextStyle: { color: '#64748b' },
  },
  legend: {
    textStyle: { color: '#a5b4c8' },
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 20,
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    textStyle: { color: '#f1f5f9' },
    padding: [10, 14],
    extraCssText: 'backdrop-filter: blur(12px); border-radius: 10px; box-shadow: 0 12px 40px rgba(2,6,23,0.6);',
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.14)' } },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontFamily: 'Fira Code, monospace' },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontFamily: 'Fira Code, monospace' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
  },
  grid: { left: 16, right: 16, top: 48, bottom: 8, containLabel: true },
};

export const lightChartTheme: ChartTheme = {
  color: COLOR_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    color: '#475569',
    fontFamily: "'Fira Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  title: {
    textStyle: { color: '#0f172a', fontSize: 15, fontWeight: 600 },
    subtextStyle: { color: '#6b7280' },
  },
  legend: {
    textStyle: { color: '#475569' },
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 20,
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderColor: 'rgba(15, 23, 42, 0.1)',
    borderWidth: 1,
    textStyle: { color: '#0f172a' },
    padding: [10, 14],
    extraCssText: 'border-radius: 10px; box-shadow: 0 12px 40px rgba(15,23,42,0.14);',
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(15,23,42,0.12)' } },
    axisTick: { show: false },
    axisLabel: { color: '#5b6b81', fontFamily: 'Fira Code, monospace' },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6b7280', fontFamily: 'Fira Code, monospace' },
    splitLine: { lineStyle: { color: 'rgba(15,23,42,0.08)' } },
  },
  grid: { left: 16, right: 16, top: 48, bottom: 8, containLabel: true },
};

export function chartThemeFor(mode: ChartMode): ChartTheme {
  return mode === 'dark' ? darkChartTheme : lightChartTheme;
}

/** 当前明暗模式下图表默认样式片段，供 option 显式覆盖（图表实例不重建，需自行传入） */
export function chartDefaults() {
  const t = chartThemeFor(mode.value) as ChartTheme & {
    legend: { textStyle: Record<string, unknown> };
    categoryAxis: Record<string, unknown>;
    valueAxis: Record<string, unknown>;
    tooltip: Record<string, unknown>;
  };
  return {
    textStyle: t.textStyle,
    legendText: t.legend.textStyle,
    tooltip: t.tooltip,
    categoryAxis: t.categoryAxis,
    valueAxis: t.valueAxis,
  };
}

/** 统一金额/数值格式化（千分位） */
export function fmtAmount(n: number | string | undefined | null): string {
  const v = Number(n ?? 0);
  return v.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

/**
 * 统一日期格式化（YYYY-MM-DD）。
 * accountDate 为 'YYYY-MM-DD HH:mm:ss' 字符串或毫秒时间戳，均兼容；
 * 无法解析时原样返回，避免 NaN 日期。
 */
export function fmtDate(t: number | string | null | undefined): string {
  if (!t) return '—';
  const raw = typeof t === 'number' ? t : String(t).trim();
  const d = new Date(
    typeof raw === 'number'
      ? raw
      : raw.includes('T')
        ? raw
        : raw.replace(' ', 'T'),
  );
  if (isNaN(d.getTime())) return String(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
