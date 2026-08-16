import { onBeforeUnmount, onMounted, type Ref } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { chartThemeFor } from '../styles/chart-theme';
import { mode } from '../styles/themes';

/**
 * 初始化明暗自适应图表，并自动随窗口/容器尺寸 resize（适配移动端）。
 * 图表实例不随明暗切换销毁重建（保留 click 等绑定）；
 * 明暗切换由宿主 watch(mode) 用 chartDefaults()/chartPalette() 重绘 option 实现。
 */
export function useChart(elRef: Ref<HTMLDivElement | undefined>) {
  let chart: echarts.ECharts | null = null;
  let ro: ResizeObserver | null = null;

  onMounted(() => {
    if (!elRef.value) return;
    chart = echarts.init(elRef.value, chartThemeFor(mode.value));
    // ResizeObserver 比 window resize 更稳（覆盖侧栏抽屉展开/收起）
    ro = new ResizeObserver(() => chart?.resize());
    ro.observe(elRef.value);
  });

  onBeforeUnmount(() => {
    ro?.disconnect();
    ro = null;
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
