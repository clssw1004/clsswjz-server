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
        </div>
        <div ref="catRef" class="chart" />
      </section>

      <!-- 收支构成 -->
      <section class="glass panel fade-in" style="--d: 260ms">
        <header class="panel-head">
          <div class="panel-title">收支构成</div>
          <el-tag effect="plain" size="small">本期占比</el-tag>
        </header>
        <div ref="composeRef" class="chart" />
      </section>
    </div>

    <!-- 月度收支趋势（全宽 + 数据表） -->
    <section class="glass panel trend-panel fade-in" style="--d: 200ms">
      <header class="panel-head">
        <div class="panel-title">月度收支趋势</div>
        <el-tag effect="plain" size="small">按月汇总</el-tag>
      </header>
      <div ref="trendRef" class="chart" />
      <!-- 月度数据明细 -->
      <div v-if="trendData.length" class="trend-table">
        <div class="trend-table-head">月度数据明细</div>
        <el-table
          :data="trendData.slice().reverse()"
          size="small"
          max-height="260"
          :header-cell-style="{ background: 'transparent' }"
        >
          <el-table-column prop="period" label="月份" width="92">
            <template #default="{ row }"><span class="num">{{ row.period }}</span></template>
          </el-table-column>
          <el-table-column label="支出" min-width="110" align="right">
            <template #default="{ row }">
              <span class="num is-expense">−¥{{ fmtAmount(row.expense) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="收入" min-width="110" align="right">
            <template #default="{ row }">
              <span class="num is-income">+¥{{ fmtAmount(row.income) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="结余" min-width="110" align="right">
            <template #default="{ row }">
              <span class="num" :class="row.income - row.expense >= 0 ? 'is-income' : 'is-expense'">
                {{ fmtAmount(row.income - row.expense) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <!-- 账户 / 商户 分布 -->
    <div class="chart-row">
      <section class="glass panel fade-in" style="--d: 260ms">
        <header class="panel-head">
          <div class="panel-title">账户资金分布</div>
          <el-tag effect="plain" size="small">按支出</el-tag>
        </header>
        <div ref="fundRef" class="chart" />
      </section>
      <section class="glass panel fade-in" style="--d: 320ms">
        <header class="panel-head">
          <div class="panel-title">商户 Top</div>
          <el-tag effect="plain" size="small">按支出</el-tag>
        </header>
        <div ref="shopRef" class="chart" />
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

    <!-- 通用账目明细弹窗（点击任意图表图例/切片） -->
    <ItemListDialog
      :visible="itemDialogVisible"
      :book-id="bookId"
      :title="itemDialogTitle"
      :filters="itemDialogFilters"
      @update:visible="itemDialogVisible = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { graphic } from 'echarts';
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
import { activeTheme, chartColors, rgba } from '../styles/themes';
import ItemListDialog, {
  type ItemFilters,
} from '../components/ItemListDialog.vue';

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
const catsData = ref<any[]>([]);
const trendData = ref<any[]>([]);
const restCount = computed(() => Math.max(0, allCats.value.length - TOP));
const dialogVisible = ref(false);

const catRef = ref<HTMLDivElement>();
const trendRef = ref<HTMLDivElement>();
const composeRef = ref<HTMLDivElement>();
const fundRef = ref<HTMLDivElement>();
const shopRef = ref<HTMLDivElement>();
const { setOption: setCats, getChart: getCatChart } = useChart(catRef);
const { setOption: setTrend, getChart: getTrendChart } = useChart(trendRef);
const { setOption: setCompose, getChart: getComposeChart } = useChart(composeRef);
const { setOption: setFunds, getChart: getFundChart } = useChart(fundRef);
const { setOption: setShops, getChart: getShopChart } = useChart(shopRef);

const overviewData = ref<any>(null);
const fundsData = ref<any[]>([]);
const shopsData = ref<any[]>([]);

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
    catsData.value = cats;
    allCats.value = cats;
    const total = cats.reduce((s, c) => s + Number(c.amount || 0), 0);
    catTotal.value = total;
    const isExpense = catType.value === 'EXPENSE';
    // 分类多：饼图只展示 Top-N，其余归入「其他」（点击查看明细）
    const top = cats.slice(0, TOP).map((c: any) => ({
      name: c.categoryName,
      value: Number(c.amount || 0),
    }));
    const restSum = cats
      .slice(TOP)
      .reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
    if (restSum > 0) top.push({ name: '其他', value: restSum });

    setCats({
      title: {
        text: `¥ ${fmtAmount(total)}`,
        subtext: isExpense ? '支出总计' : '收入总计',
        left: 'center',
        top: '36%',
        textStyle: {
          fontSize: 22,
          fontWeight: 700,
          color: '#f1f5f9',
          fontFamily: 'Fira Code, monospace',
        },
        subtextStyle: { fontSize: 12, color: '#64748b' },
      },
      tooltip: {
        trigger: 'item',
        formatter:
          '{b}<br/><span style="font-family:Fira Code">¥{c}</span> · {d}%',
      },
      legend: {
        show: true,
        orient: 'vertical',
        right: 8,
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 8,
        textStyle: { fontSize: 12 },
        data: top.map((i) => i.name),
      },
      series: [
        {
          name: '分类',
          type: 'pie',
          roseType: 'area',
          radius: ['18%', '72%'],
          center: ['42%', '50%'],
          itemStyle: { borderRadius: 6, borderColor: '#0b1120', borderWidth: 2 },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: '#cbd5e1',
            fontSize: 11,
            lineHeight: 14,
          },
          labelLine: { lineStyle: { color: 'rgba(255,255,255,0.25)' } },
          emphasis: {
            scaleSize: 6,
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.4)' },
          },
          data: top.map((i) => ({
            name: i.name,
            value: i.value,
            itemStyle:
              i.name === '其他' ? { color: '#475569' } : undefined,
          })),
        },
      ],
    });
  });
}

function loadTrend() {
  adminApi
    .statsTrend({ granularity: 'month', ...bookParams() })
    .then((trend: any[]) => {
      trendData.value = trend;
      const { primary, accent, primaryLight, accentLight } = chartColors();
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
                { offset: 0, color: primaryLight },
                { offset: 1, color: rgba(primary, 0.35) },
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
                { offset: 0, color: accentLight },
                { offset: 1, color: rgba(accent, 0.35) },
              ]),
            },
          },
        ],
      });
    });
}

// 收支构成 donut（支出 vs 收入）
function renderCompose(o: any) {
  const { primary, accent } = chartColors();
  const total = (o.expenseTotal || 0) + (o.incomeTotal || 0);
  setCompose({
    title: {
      text: `¥ ${fmtAmount(total)}`,
      subtext: '总收支',
      left: 'center',
      top: '36%',
      textStyle: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Fira Code, monospace' },
      subtextStyle: { fontSize: 12, color: '#64748b' },
    },
    tooltip: { trigger: 'item', formatter: '{b}<br/>¥{c} · {d}%' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['44%', '68%'],
        center: ['50%', '43%'],
        itemStyle: { borderRadius: 6, borderColor: '#0b1120', borderWidth: 2 },
        label: { show: false },
        data: [
          { name: '支出', value: o.expenseTotal || 0, itemStyle: { color: primary } },
          { name: '收入', value: o.incomeTotal || 0, itemStyle: { color: accent } },
        ],
      },
    ],
  });
}

// 账户资金分布（按支出，横向条形）
function renderFunds(rows: any[]) {
  const { primary } = chartColors();
  const items = rows.slice(0, 8).slice().reverse();
  setFunds({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>¥{c}' },
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: items.map((r) => r.fundName), axisLabel: { color: '#94a3b8', width: 70, overflow: 'truncate' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        type: 'bar',
        barMaxWidth: 14,
        data: items.map((r) => r.expense),
        itemStyle: {
          borderRadius: [0, 5, 5, 0],
          color: new graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: rgba(primary, 0.35) },
            { offset: 1, color: primary },
          ]),
        },
      },
    ],
  });
}

// 商户 Top（按支出，横向条形）
function renderShops(rows: any[]) {
  const { accent } = chartColors();
  const items = rows.slice(0, 8).slice().reverse();
  setShops({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>¥{c}' },
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: items.map((r) => r.shopName), axisLabel: { color: '#94a3b8', width: 70, overflow: 'truncate' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        type: 'bar',
        barMaxWidth: 14,
        data: items.map((r) => r.expense),
        itemStyle: {
          borderRadius: [0, 5, 5, 0],
          color: new graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: rgba(accent, 0.35) },
            { offset: 1, color: accent },
          ]),
        },
      },
    ],
  });
}

function loadFunds() {
  adminApi.statsFunds(bookParams()).then((rows: any[]) => {
    fundsData.value = rows;
    renderFunds(rows);
  });
}
function loadShops() {
  adminApi.statsShops(bookParams()).then((rows: any[]) => {
    shopsData.value = rows;
    renderShops(rows);
  });
}

// 主题切换时用缓存数据重绘图表
watch(activeTheme, () => {
  if (catsData.value.length) loadCategories();
  if (trendData.value.length) loadTrend();
  if (overviewData.value) renderCompose(overviewData.value);
  if (fundsData.value.length) renderFunds(fundsData.value);
  if (shopsData.value.length) renderShops(shopsData.value);
});

async function loadOverview() {
  const o = await adminApi.statsOverview(bookParams());
  overviewData.value = o;
  cards.value = [
    { label: '记账笔数', value: o.itemCount, icon: Tickets, grad: 'grad-cyan' },
    { label: '支出合计', value: `¥ ${fmtAmount(o.expenseTotal)}`, icon: Bottom, grad: 'grad-red' },
    { label: '收入合计', value: `¥ ${fmtAmount(o.incomeTotal)}`, icon: Top, grad: 'grad-green' },
    { label: '结余', value: `¥ ${fmtAmount(o.balance)}`, icon: Wallet, grad: 'grad-gold' },
  ];
  renderCompose(o);
}

function reload() {
  loadOverview();
  loadCategories();
  loadTrend();
  loadFunds();
  loadShops();
}

/* ---------- 通用账目明细弹窗 ---------- */
const itemDialogVisible = ref(false);
const itemDialogTitle = ref('');
const itemDialogFilters = ref<ItemFilters>({});

function openItems(filters: ItemFilters, title: string) {
  itemDialogFilters.value = { ...filters };
  itemDialogTitle.value = title;
  itemDialogVisible.value = true;
}

onMounted(async () => {
  await loadBooks();
  reload();

  // 分类玫瑰图：点击分类/其他 → 该分类账目明细
  getCatChart()?.on('click', (params: any) => {
    const name = params.name;
    if (name === '其他') {
      const codes = catsData.value
        .slice(TOP)
        .map((c: any) => c.categoryCode)
        .filter(Boolean);
      if (codes.length) {
        openItems(
          { categoryCodes: codes.join(',') },
          `其他分类账目（${codes.length} 个分类）`,
        );
      }
    } else {
      const cat = catsData.value.find((c: any) => c.categoryName === name);
      if (cat?.categoryCode) {
        openItems({ categoryCodes: cat.categoryCode }, name);
      }
    }
  });

  // 收支构成：点击支出/收入 → 对应类型账目
  getComposeChart()?.on('click', (params: any) => {
    const type =
      params.name === '支出' ? 'EXPENSE' : params.name === '收入' ? 'INCOME' : '';
    if (type) openItems({ type }, `${params.name}账目`);
  });

  // 账户资金分布：点击账户 → 该账户账目
  getFundChart()?.on('click', (params: any) => {
    const fund = fundsData.value.find((f) => f.fundName === params.name);
    if (fund?.fundId) openItems({ fundIds: fund.fundId }, `${fund.fundName} 账目`);
  });

  // 商户 Top：点击商户 → 该商户账目
  getShopChart()?.on('click', (params: any) => {
    const shop = shopsData.value.find((s) => s.shopName === params.name);
    if (shop?.shopCode) openItems({ shopCodes: shop.shopCode }, `${shop.shopName} 账目`);
  });

  // 月度趋势：点击某月柱 → 该月账目
  getTrendChart()?.on('click', (params: any) => {
    if (params.name) openItems({ month: params.name }, `${params.name} 账目`);
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
.stat-icon.grad-gold { background: var(--grad-gold); color: var(--on-primary); }
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

/* 月度数据明细表 */
.trend-table {
  margin-top: 14px;
  border-top: 1px solid var(--border-glass);
  padding-top: 12px;
}
.trend-table-head {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 8px;
}
.trend-table .is-expense { color: var(--brand-red-light); }
.trend-table .is-income { color: var(--color-success); }

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
