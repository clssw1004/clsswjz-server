/**
 * ECharts 暗色玻璃主题 — 所有图表统一引用，保证视觉一致性。
 * 直接传给 echarts.init(el, theme)，无需 registerTheme。
 */
/**
 * echarts.init 的主题对象类型接受 object，这里用宽松类型便于组合。
 */
export type ChartTheme = Record<string, unknown>;

export const chartTheme: ChartTheme = {
  color: [
    '#f59e0b',
    '#8b5cf6',
    '#10b981',
    '#06b6d4',
    '#f43f5e',
    '#a78bfa',
    '#fbbf24',
    '#34d399',
  ],
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

/** 统一金额/数值格式化（千分位） */
export function fmtAmount(n: number | string | undefined | null): string {
  const v = Number(n ?? 0);
  return v.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}
