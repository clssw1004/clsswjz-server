<template>
  <div class="stats">
    <!-- 账本选择（强制选一个账本，默认最新创建） -->
    <div class="stats-toolbar glass fade-in">
      <el-select
        v-model="bookId"
        filterable
        size="large"
        placeholder="选择账本"
        :prefix-icon="Notebook"
        style="width: 300px; max-width: 100%"
        @change="reload"
      >
        <el-option
          v-for="b in books"
          :key="b.id"
          :label="b.name"
          :value="b.id"
        >
          <span>{{ b.name }}</span>
          <span class="book-opt-id num">{{ b.id.slice(0, 8) }}</span>
        </el-option>
      </el-select>
      <span class="stats-toolbar-hint">
        {{ selectedBookName }}
      </span>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div
        v-for="(c, i) in cards"
        :key="c.label"
        class="stat-card glass glass-hover fade-in"
        :style="{ '--d': `${i * 55}ms` }"
      >
        <div class="stat-icon" :class="c.grad">
          <el-icon :size="22"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-value num">{{ c.value }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-row">
      <!-- 分类占比 -->
      <section class="glass panel fade-in" style="--d: 200ms">
        <header class="panel-head">
          <div class="panel-title">分类占比</div>
          <div class="panel-head-right">
            <el-radio-group v-model="catType" size="small" @change="loadCategories">
              <el-radio-button value="EXPENSE">支出</el-radio-button>
              <el-radio-button value="INCOME">收入</el-radio-button>
            </el-radio-group>
            <el-tooltip content="查看全部分类明细">
              <el-button
                text
                size="small"
                class="cat-all-btn"
                :disabled="!allCats.length"
                @click="dialogVisible = true"
              >
                <el-icon style="margin-right: 4px"><ZoomIn /></el-icon>
                全部分类
              </el-button>
            </el-tooltip>
          </div>
        </header>
        <div v-if="catTotal > 0" class="cat-summary num">
          共 ¥{{ fmtAmount(catTotal) }} · 前 {{ TOP }} + 其他（{{ restCount }} 个）
          <span v-if="restCount > 0" class="cat-hint">点击「其他」查看明细</span>
        </div>
        <div ref="catRef" class="chart" />
      </section>

      <!-- 月度收支趋势 -->
      <section class="glass panel fade-in" style="--d: 260ms">
        <header class="panel-head">
          <div class="panel-title">月度收支趋势</div>
          <el-tag effect="plain" size="small">按月汇总</el-tag>
        </header>
        <div ref="trendRef" class="chart" />
      </section>
    </div>

    <!-- 分类明细弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`分类明细 · ${catType === 'EXPENSE' ? '支出' : '收入'}（${allCats.length} 个）`"
      width="min(720px, 94vw)"
    >
      <div class="table-scroll">
        <el-table :data="allCats" size="small" max-height="60vh">
          <el-table-column prop="categoryName" label="分类" min-width="120" />
          <el-table-column label="金额" width="150">
            <template #default="{ row }">
              <span class="num">¥{{ fmtAmount(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="占比" width="120">
            <template #default="{ row }">
              <span class="num">{{ percent(row.amount) }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="count" label="笔数" width="90" align="right">
            <template #default="{ row }">
              <span class="num">{{ row.count ?? '—' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { graphic } from 'echarts/core';
import {
  Notebook,
  Tickets,
  Bottom,
  Top,
  Wallet,
  ZoomIn,
} from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { useChart } from '../composables/useChart';
import { useBookFilter } from '../composables/useBookFilter';
import { fmtAmount } from '../styles/chart-theme';

const { books, bookId, loadBooks } = useBookFilter();

const cards = ref([
  { label: '记账笔数', value: 0, icon: Tickets, grad: 'grad-cyan' },
  { label: '支出合计', value: '0', icon: Bottom, grad: 'grad-red' },
  { label: '收入合计', value: '0', icon: Top, grad: 'grad-green' },
  { label: '结余', value: '0', icon: Wallet, grad: 'grad-gold' },
]);

const catType = ref('EXPENSE');
const TOP = 8;
const catTotal = ref(0);
const allCats = ref<any[]>([]);
const restCount = computed(() => Math.max(0, allCats.value.length - TOP));
const dialogVisible = ref(false);

const catRef = ref<HTMLDivElement>();
const trendRef = ref<HTMLDivElement>();
const { setOption: setCats, getChart } = useChart(catRef);
const { setOption: setTrend } = useChart(trendRef);

const selectedBookName = computed(
  () => books.value.find((b) => b.id === bookId.value)?.name ?? '',
);

function bookParams() {
  return bookId.value ? { bookId: bookId.value } : undefined;
}

function percent(amount: number): string {
  return catTotal.value > 0
    ? ((Number(amount) / catTotal.value) * 100).toFixed(1)
    : '0';
}

function loadCategories() {
  adminApi.statsCategories(catType.value, bookParams()).then((cats: any[]) => {
    allCats.value = cats;
    const total = cats.reduce((s, c) => s + Number(c.amount || 0), 0);
    catTotal.value = total;
    const isExpense = catType.value === 'EXPENSE';
    // 分类多：只展示 Top-N，其余归入「其他」（点击查看明细）
    const top = cats.slice(0, TOP).map((c: any) => ({
      name: c.categoryName,
      value: Number(c.amount || 0),
    }));
    const restSum = cats
      .slice(TOP)
      .reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
    if (restSum > 0) top.push({ name: '其他', value: restSum });
    // yAxis category 自下而上，反转让占比最大的排在最上面
    const items = top.slice().reverse();

    setCats({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
          return `<span style="color:#94a3b8">${p.name}</span><br/><b style="font-family:Fira Code">¥${p.value.toLocaleString('zh-CN')}</b> · ${pct}%`;
        },
      },
      grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      yAxis: {
        type: 'category',
        data: items.map((i) => i.name),
        axisLabel: { color: '#94a3b8', width: 88, overflow: 'truncate' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 16,
          data: items.map((i) => i.value),
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              {
                offset: 0,
                color: isExpense
                  ? 'rgba(245,158,11,0.35)'
                  : 'rgba(139,92,246,0.35)',
              },
              { offset: 1, color: isExpense ? '#f59e0b' : '#8b5cf6' },
            ]),
          },
          label: {
            show: true,
            position: 'right',
            formatter: (p: any) =>
              total > 0 ? `${((p.value / total) * 100).toFixed(1)}%` : '',
            color: '#a5b4c8',
            fontSize: 11,
            fontFamily: 'Fira Code, monospace',
          },
        },
      ],
    });
  });
}

function loadTrend() {
  adminApi
    .statsTrend({ granularity: 'month', ...bookParams() })
    .then((trend: any[]) => {
      setTrend({
        tooltip: { trigger: 'axis' },
        legend: { data: ['支出', '收入'] },
        xAxis: { type: 'category', data: trend.map((d) => d.period) },
        yAxis: { type: 'value' },
        series: [
          {
            name: '支出',
            type: 'bar',
            barMaxWidth: 18,
            data: trend.map((d) => d.expense),
            itemStyle: {
              borderRadius: [5, 5, 0, 0],
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#fbbf24' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.35)' },
              ]),
            },
          },
          {
            name: '收入',
            type: 'bar',
            barMaxWidth: 18,
            data: trend.map((d) => d.income),
            itemStyle: {
              borderRadius: [5, 5, 0, 0],
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#a78bfa' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.35)' },
              ]),
            },
          },
        ],
      });
    });
}

async function loadOverview() {
  const o = await adminApi.statsOverview(bookParams());
  cards.value = [
    { label: '记账笔数', value: o.itemCount, icon: Tickets, grad: 'grad-cyan' },
    { label: '支出合计', value: `¥ ${fmtAmount(o.expenseTotal)}`, icon: Bottom, grad: 'grad-red' },
    { label: '收入合计', value: `¥ ${fmtAmount(o.incomeTotal)}`, icon: Top, grad: 'grad-green' },
    { label: '结余', value: `¥ ${fmtAmount(o.balance)}`, icon: Wallet, grad: 'grad-gold' },
  ];
}

function reload() {
  loadOverview();
  loadCategories();
  loadTrend();
}

onMounted(async () => {
  await loadBooks();
  reload();
  // 点击「其他」条形 → 打开全部分类明细
  getChart()?.on('click', (params: any) => {
    if (params.name === '其他' && restCount.value > 0) {
      dialogVisible.value = true;
    }
  });
});
</script>

<style scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  flex-wrap: wrap;
}
.stats-toolbar-hint {
  font-size: 12px;
  color: var(--text-3);
}
.book-opt-id {
  float: right;
  margin-left: 14px;
  font-size: 11px;
  color: var(--text-3);
}
.cat-summary {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cat-hint {
  color: var(--brand-gold);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  min-width: 0;
}
.stat-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 8px 20px rgba(2, 6, 23, 0.4);
}
.stat-icon.grad-gold { background: var(--grad-gold); color: #1c1204; }
.stat-icon.grad-green { background: var(--grad-green); }
.stat-icon.grad-cyan { background: var(--grad-cyan); }
.stat-icon.grad-red { background: var(--grad-red); }
.stat-body {
  flex: 1;
  min-width: 0;
}
.stat-label {
  font-size: 12px;
  color: var(--text-2);
}
.stat-value {
  margin-top: 3px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.panel {
  padding: 20px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}
.panel-head-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
}
.chart {
  height: 320px;
}

@media (max-width: 1200px) {
  .stat-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 900px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }
  .stat-body {
    width: 100%;
  }
  .stat-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
  }
  .stat-value {
    font-size: clamp(14px, 4.2vw, 18px);
  }
  .chart {
    height: 250px;
  }
  .panel {
    padding: 14px;
  }
}
</style>
