<template>
  <div>
    <el-row :gutter="16">
      <el-col v-for="c in cards" :key="c.label" :span="4">
        <el-card>
          <div class="l">{{ c.label }}</div>
          <div class="v">{{ c.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card>
          <div ref="pieRef" style="height: 320px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="trendRef" style="height: 320px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import { adminApi } from '../api/admin';

const cards = ref<any[]>([]);
const pieRef = ref<HTMLDivElement>();
const trendRef = ref<HTMLDivElement>();

onMounted(async () => {
  const o = await adminApi.statsOverview();
  cards.value = [
    { label: '账本数', value: o.bookCount },
    { label: '记账笔数', value: o.itemCount },
    { label: '支出', value: o.expenseTotal },
    { label: '收入', value: o.incomeTotal },
    { label: '结余', value: o.balance },
    { label: '分类数', value: o.categoryCount },
  ];

  const cats = await adminApi.statsCategories('EXPENSE');
  const pie = echarts.init(pieRef.value!);
  pie.setOption({
    title: { text: '支出分类占比' },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: cats.map((c: any) => ({ name: c.categoryName, value: c.amount })),
      },
    ],
  });

  const trend = await adminApi.statsTrend({ granularity: 'month' });
  const t = echarts.init(trendRef.value!);
  t.setOption({
    title: { text: '月度收支趋势' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['支出', '收入'] },
    xAxis: { type: 'category', data: trend.map((d: any) => d.period) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '支出',
        type: 'bar',
        data: trend.map((d: any) => d.expense),
      },
      {
        name: '收入',
        type: 'bar',
        data: trend.map((d: any) => d.income),
      },
    ],
  });
});
</script>

<style scoped>
.l {
  color: #909399;
  font-size: 13px;
}
.v {
  font-size: 20px;
  font-weight: 600;
  margin-top: 6px;
}
</style>
