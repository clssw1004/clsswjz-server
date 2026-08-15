import { onBeforeUnmount, onMounted, type Ref } from 'vue';
import { init } from 'echarts/core';
import type { ECharts } from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { chartTheme } from '../styles/chart-theme';
import '../styles/echarts-setup';

/**
 * 初始化暗色主题图表，并自动随窗口/容器尺寸 resize（适配移动端）。
 */
export function useChart(elRef: Ref<HTMLDivElement | undefined>) {
  let chart: ECharts | null = null;
  let ro: ResizeObserver | null = null;

  onMounted(() => {
    if (!elRef.value) return;
    chart = init(elRef.value, chartTheme as any);
    // ResizeObserver 比 window resize 更稳（覆盖侧栏抽屉展开/收起）
    ro = new ResizeObserver(() => chart?.resize());
    ro.observe(elRef.value);
  });

  onBeforeUnmount(() => {
    ro?.disconnect();
    chart?.dispose();
    chart = null;
  });

  function setOption(option: EChartsOption) {
    chart?.setOption(option);
  }

  function getChart() {
    return chart;
  }

  return { setOption, getChart };
}
