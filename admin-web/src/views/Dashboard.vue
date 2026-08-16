<template>
  <div class="dash">
    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div
        v-for="(c, i) in cards"
        :key="c.label"
        class="stat-card glass glass-hover fade-in"
        :style="{ '--d': `${i * 60}ms` }"
      >
        <div class="stat-icon" :class="c.grad">
          <el-icon :size="22"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-value num">{{ fmtNum(c.value) }}</div>
        </div>
      </div>
    </div>

    <!-- 收支趋势 -->
    <section class="glass fade-in panel" style="--d: 160ms">
      <header class="panel-head">
        <div class="panel-title">月度收支趋势</div>
        <el-tag effect="plain" size="small">月度汇总</el-tag>
      </header>
      <div ref="trendRef" class="chart" />
    </section>

    <!-- 日志回放状态 -->
    <section class="glass fade-in panel" style="--d: 220ms">
      <header class="panel-head">
        <div class="panel-title">日志回放状态</div>
        <el-tag
          :type="replay.failed > 0 ? 'danger' : 'success'"
          effect="plain"
          size="small"
        >
          {{ replay.failed > 0 ? `${replay.failed} 条失败` : '运行正常' }}
        </el-tag>
      </header>

      <div class="replay-metrics">
        <div class="replay-item">
          <span class="replay-label">已回放</span>
          <span class="replay-value num ok">{{ replay.materialized }}</span>
        </div>
        <div class="replay-item">
          <span class="replay-label">待回放</span>
          <span class="replay-value num pending">{{ replay.pending }}</span>
        </div>
        <div class="replay-item">
          <span class="replay-label">失败</span>
          <span class="replay-value num err">{{ replay.failed }}</span>
        </div>
        <div class="replay-item">
          <span class="replay-label">总日志</span>
          <span class="replay-value num total">{{ replay.total }}</span>
        </div>
      </div>

      <div class="replay-progress">
        <el-progress
          :percentage="replayPercent"
          :stroke-width="12"
          :format="formatPercent"
        />
        <span class="replay-hint num">{{ replayPercent }}% 已回放 · 按操作时间顺序重建</span>
      </div>

      <template v-if="replay.recentErrors.length">
        <el-divider style="margin: 18px 0" />
        <div class="replay-errors-title">
          最近失败日志
          <span class="num">{{ replay.recentErrors.length }} 条</span>
        </div>
        <div class="table-scroll table-only">
          <el-table :data="replay.recentErrors" size="small">
            <el-table-column prop="businessType" label="业务" width="110">
              <template #default="{ row }">
                <el-tag effect="plain" size="small">{{ row.businessType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operateType" label="操作" width="96" />
            <el-table-column prop="businessId" label="业务ID" width="200" show-overflow-tooltip />
            <el-table-column prop="error" label="错误" show-overflow-tooltip />
          </el-table>
        </div>
        <div class="m-list card-only" style="margin-top: 10px">
          <div v-for="e in replay.recentErrors" :key="e.id" class="m-card">
            <div class="m-card-head">
              <el-tag effect="plain" size="small">{{ e.businessType }}</el-tag>
              <span class="op-type">{{ e.operateType }}</span>
              <div class="m-card-main" style="text-align: right">
                <span class="num mc-eid">{{ e.businessId }}</span>
              </div>
            </div>
            <div class="mc-error">{{ e.error }}</div>
          </div>
        </div>
      </template>

      <div class="replay-actions">
        <el-button type="primary" :loading="replaying" @click="materialize">
          <el-icon style="margin-right: 6px"><Refresh /></el-icon>
          立即回放日志
        </el-button>
        <el-button type="danger" plain :loading="replaying" @click="materializeReset">
          <el-icon style="margin-right: 6px"><RefreshLeft /></el-icon>
          重头回放
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { graphic } from 'echarts';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  User,
  Document,
  Promotion,
  UserFilled,
  Refresh,
  RefreshLeft,
} from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { useChart } from '../composables/useChart';
import { activeTheme, chartColors, rgba } from '../styles/themes';

const cards = ref([
  { label: '总用户', value: 0, icon: User, grad: 'grad-purple' },
  { label: '总日志', value: 0, icon: Document, grad: 'grad-cyan' },
  { label: '7日活跃', value: 0, icon: UserFilled, grad: 'grad-gold' },
  { label: '今日推送', value: 0, icon: Promotion, grad: 'grad-green' },
]);

const replay = ref<any>({
  total: 0,
  materialized: 0,
  pending: 0,
  failed: 0,
  recentErrors: [],
});
const replaying = ref(false);

const replayPercent = computed(() => {
  if (!replay.value.total) return 0;
  return Math.round((replay.value.materialized / replay.value.total) * 100);
});

function fmtNum(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString('zh-CN');
}

function formatPercent(p: number): string {
  return `${p}%`;
}

const trendRef = ref<HTMLDivElement>();
const { setOption: setTrend } = useChart(trendRef);
const trendData = ref<{ period: string; expense: number; income: number }[]>([]);

function renderTrend(data: { period: string; expense: number; income: number }[]) {
  const { primary, accent } = chartColors();
  setTrend({
    tooltip: { trigger: 'axis' },
    legend: { data: ['支出', '收入'] },
    xAxis: { type: 'category', boundaryGap: false, data: data.map((d) => d.period) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '支出',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: data.map((d) => d.expense),
        lineStyle: { width: 3, color: primary },
        itemStyle: { color: primary },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: rgba(primary, 0.32) },
            { offset: 1, color: rgba(primary, 0.02) },
          ]),
        },
      },
      {
        name: '收入',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        data: data.map((d) => d.income),
        lineStyle: { width: 3, color: accent },
        itemStyle: { color: accent },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: rgba(accent, 0.28) },
            { offset: 1, color: rgba(accent, 0.02) },
          ]),
        },
      },
    ],
  });
}

// 主题切换时用缓存数据重绘图表
watch(activeTheme, () => {
  if (trendData.value.length) renderTrend(trendData.value);
});

async function load() {
  const o = await adminApi.overview();
  cards.value = [
    { label: '总用户', value: o.totalUsers, icon: User, grad: 'grad-purple' },
    { label: '总日志', value: o.totalLogs, icon: Document, grad: 'grad-cyan' },
    { label: '7日活跃', value: o.activeUsers7d, icon: UserFilled, grad: 'grad-gold' },
    { label: '今日推送', value: o.todayPushCount, icon: Promotion, grad: 'grad-green' },
  ];
  replay.value = await adminApi.materializeStatus();
  trendData.value = await adminApi.statsTrend({ granularity: 'month' });
  renderTrend(trendData.value);
}

async function materialize() {
  replaying.value = true;
  try {
    await adminApi.materialize();
    ElMessage.success('日志回放已触发');
    await load();
  } finally {
    replaying.value = false;
  }
}

async function materializeReset() {
  try {
    await ElMessageBox.confirm(
      '将清空全部业务表（账本/记账/分类/账户等）并从日志完整重建。' +
        '用户与日志数据不受影响，但重建期间报表数据为空。确定继续？',
      '重头回放',
      { type: 'warning', confirmButtonText: '确定清空并重建', cancelButtonText: '取消' },
    );
  } catch {
    return;
  }
  replaying.value = true;
  try {
    await adminApi.materializeReset();
    ElMessage.success('已清空业务表并从日志完整重建');
    await load();
  } finally {
    replaying.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---------- 统计卡片 ---------- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  min-width: 0;
}
.stat-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 8px 20px rgba(2, 6, 23, 0.4);
}
.stat-icon.grad-gold { background: var(--grad-gold); color: var(--on-primary); }
.stat-icon.grad-purple { background: var(--grad-purple); }
.stat-icon.grad-green { background: var(--grad-green); }
.stat-icon.grad-cyan { background: var(--grad-cyan); }
.stat-label {
  font-size: 13px;
  color: var(--text-2);
}
.stat-value {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- 面板 ---------- */
.panel {
  padding: 20px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
}
.chart {
  height: 300px;
}

/* ---------- 回放状态 ---------- */
.replay-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.replay-item {
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.replay-label {
  font-size: 12px;
  color: var(--text-2);
}
.replay-value {
  font-size: 22px;
  font-weight: 700;
}
.replay-value.ok { color: var(--color-success); }
.replay-value.pending { color: var(--brand-cyan-light); }
.replay-value.err { color: var(--color-danger); }
.replay-value.total { color: var(--text-1); }

.replay-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.replay-hint {
  font-size: 12px;
  color: var(--text-3);
}
.replay-errors-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 8px;
}
.replay-errors-title span {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 400;
}

/* 失败日志移动端卡片 */
.op-type {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-red-light);
}
.mc-eid {
  font-size: 11px;
  color: var(--text-3);
}
.mc-error {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-2);
  word-break: break-all;
  padding: 8px 10px;
  background: var(--surface-glass);
  border-radius: var(--radius-sm);
}
.replay-actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1023px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .stat-grid {
    gap: 12px;
  }
  .stat-card {
    padding: 14px;
    gap: 10px;
  }
  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  .stat-value {
    font-size: 20px;
  }
  .chart {
    height: 240px;
  }
  .panel {
    padding: 14px;
  }
  .replay-metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>
