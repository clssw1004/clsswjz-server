<template>
  <div>
    <el-row :gutter="16">
      <el-col v-for="card in cards" :key="card.label" :span="6">
        <el-card>
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 16px">
      <div ref="trendRef" style="height: 320px"></div>
    </el-card>

    <el-button type="primary" style="margin-top: 16px" @click="materialize">
      立即回放日志
    </el-button>
    <el-button
      type="danger"
      plain
      style="margin-top: 16px; margin-left: 12px"
      @click="materializeReset"
    >
      重头回放（清空业务表重建）
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api/admin';

const trendRef = ref<HTMLDivElement>();
const cards = ref([
  { label: '总用户', value: 0 },
  { label: '总日志', value: 0 },
  { label: '7日活跃', value: 0 },
  { label: '今日推送', value: 0 },
]);

async function load() {
  const o = await adminApi.overview();
  cards.value = [
    { label: '总用户', value: o.totalUsers },
    { label: '总日志', value: o.totalLogs },
    { label: '7日活跃', value: o.activeUsers7d },
    { label: '今日推送', value: o.todayPushCount },
  ];
  const trend = await adminApi.statsTrend({ granularity: 'month' });
  renderTrend(trend);
}

function renderTrend(data: { period: string; expense: number; income: number }[]) {
  const chart = echarts.init(trendRef.value!);
  chart.setOption({
    title: { text: '月度收支趋势' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['支出', '收入'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: data.map((d) => d.period) },
    yAxis: { type: 'value' },
    series: [
      { name: '支出', type: 'line', data: data.map((d) => d.expense) },
      { name: '收入', type: 'line', data: data.map((d) => d.income) },
    ],
  });
}

async function materialize() {
  await adminApi.materialize();
  ElMessage.success('日志回放已触发');
}

async function materializeReset() {
  await ElMessageBox.confirm(
    '将清空全部业务表（账本/记账/分类/账户等）并从日志完整重建。' +
      '用户与日志数据不受影响，但重建期间报表数据为空。确定继续？',
    '重头回放',
    { type: 'warning', confirmButtonText: '确定清空并重建', cancelButtonText: '取消' },
  );
  await adminApi.materializeReset();
  ElMessage.success('已清空业务表并从日志完整重建');
  await load();
}

onMounted(load);
</script>

<style scoped>
.stat-label {
  color: #909399;
  font-size: 13px;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-top: 8px;
}
</style>
