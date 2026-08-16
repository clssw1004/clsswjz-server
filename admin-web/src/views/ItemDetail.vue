<template>
  <div class="detail">
    <!-- 返回 -->
    <button class="back-btn" type="button" @click="$router.back()">
      <el-icon :size="16"><ArrowLeft /></el-icon>
      返回账目列表
    </button>

    <!-- 账目信息 -->
    <section class="glass panel fade-in" v-if="item">
      <div class="item-head">
        <el-tag
          :type="item.type === 'EXPENSE' ? 'danger' : 'success'"
          effect="dark"
          size="large"
          round
        >
          {{ item.type === 'EXPENSE' ? '支出' : '收入' }}
        </el-tag>
        <div class="item-amount" :class="item.type === 'EXPENSE' ? 'is-expense' : 'is-income'">
          <span class="num">{{ item.type === 'EXPENSE' ? '−' : '+' }}{{ fmtAmount(Math.abs(item.amount)) }}</span>
        </div>
      </div>

      <div class="item-grid">
        <div class="ig-item"><span class="ig-label">日期</span><span class="num">{{ fmtDate(item.accountDate) }}</span></div>
        <div class="ig-item"><span class="ig-label">分类</span><span>{{ item.categoryName ?? item.categoryCode ?? '—' }}</span></div>
        <div class="ig-item"><span class="ig-label">商户</span><span>{{ item.shopName ?? item.shopCode ?? '—' }}</span></div>
        <div class="ig-item"><span class="ig-label">账户</span><span>{{ item.fundName ?? item.fundId ?? '—' }}</span></div>
        <div v-if="item.projectCode" class="ig-item"><span class="ig-label">项目</span><span>{{ item.projectCode }}</span></div>
        <div v-if="item.source" class="ig-item"><span class="ig-label">来源</span><span class="num">{{ item.source }} · {{ (item.sourceId || '').slice(0, 8) }}</span></div>
      </div>

      <div v-if="item.description" class="item-desc">
        <span class="ig-label">描述</span>
        <span>{{ item.description }}</span>
      </div>

      <div class="item-foot num">
        ID {{ item.id }}
        <span class="dot" aria-hidden="true" />
        创建 {{ fmt(item.createdAt) }}
        <span class="dot" aria-hidden="true" />
        更新 {{ fmt(item.updatedAt) }}
      </div>
    </section>

    <!-- 变迁时间线 -->
    <section class="glass panel fade-in" style="--d: 90ms">
      <header class="panel-head">
        <div class="panel-title">变迁时间线</div>
        <el-tag effect="plain" size="small" class="num">{{ logs.length }} 条日志</el-tag>
      </header>

      <el-timeline v-if="timeline.length" class="timeline">
        <el-timeline-item
          v-for="tl in timeline"
          :key="tl.log.id"
          :type="logType(tl.log.operateType)"
          :timestamp="fmt(tl.log.operatedAt)"
          :hollow="false"
        >
          <LogChangeView :log="tl.log" :name-map="nameMap" :prev="tl.prev" />
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无该账目的日志" :image-size="60" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { fmtAmount } from '../styles/chart-theme';
import LogChangeView from '../components/LogChangeView.vue';

const route = useRoute();
const id = route.params.id as string;
const item = ref<any>(null);
const logs = ref<any[]>([]);
const timeline = ref<Array<{ log: any; prev: any }>>([]);
const nameMap = ref<{
  categories: Record<string, string>;
  shops: Record<string, string>;
  funds: Record<string, string>;
}>({ categories: {}, shops: {}, funds: {} });

function fmt(t: number | null | undefined) {
  return t ? new Date(Number(t)).toLocaleString() : '—';
}
function fmtDate(t: number | string | null | undefined) {
  if (!t) return '—';
  const d = typeof t === 'number' ? new Date(t) : new Date(Number(t));
  if (isNaN(d.getTime())) return String(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 时间线节点颜色（与 LogChangeView 内标签颜色一致） */
function logType(t?: string) {
  const m: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
    create: 'success',
    update: 'primary',
    delete: 'danger',
    batch_create: 'success',
    batch_update: 'warning',
    batch_delete: 'danger',
  };
  return m[(t || '').toLowerCase()] ?? 'info';
}

const TIMELINE_META_KEYS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'parentId',
  'lastAccountItemAt',
  'accountBookId',
]);

/**
 * 按日志顺序重建账目状态：每条日志附带「变更前快照」，
 * 供 LogChangeView 对比显示「修改：旧值 → 新值」。
 */
function buildTimeline(logs: any[]): Array<{ log: any; prev: any }> {
  let state: any = {};
  return logs.map((log) => {
    const prev = { ...state };
    const d =
      log.operateData && typeof log.operateData === 'object'
        ? log.operateData
        : {};
    const k = (log.operateType || '').toLowerCase();
    if (k === 'create' || k === 'update' || k === 'batch_update') {
      for (const [key, val] of Object.entries(d)) {
        if (
          !TIMELINE_META_KEYS.has(key) &&
          val !== undefined &&
          val !== null &&
          val !== ''
        ) {
          state[key] = val;
        }
      }
    } else if (k === 'delete' || k === 'batch_delete') {
      state = {};
    }
    return { log, prev };
  });
}

onMounted(async () => {
  const detail = await adminApi.itemDetail(id);
  item.value = detail.item;
  logs.value = detail.logs ?? [];
  timeline.value = buildTimeline(logs.value);
  nameMap.value = detail.nameMap ?? { categories: {}, shops: {}, funds: {} };
});
</script>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  background: var(--surface-glass);
  color: var(--text-2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.back-btn:hover {
  background: var(--surface-hover);
  color: var(--text-1);
  border-color: var(--border-glass-strong);
}

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

.item-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.item-amount {
  font-size: 28px;
  font-weight: 700;
}
.item-amount.is-expense { color: var(--brand-red-light); }
.item-amount.is-income { color: var(--color-success); }

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.ig-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.ig-label {
  font-size: 11px;
  color: var(--text-3);
}
.item-desc {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface-glass);
  border-radius: var(--radius-sm);
  font-size: 13px;
  word-break: break-all;
}
.item-foot {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-3);
}
.item-foot .dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-3);
}

/* 时间线 */
.timeline {
  padding: 4px 2px;
}
.timeline :deep(.el-timeline-item__timestamp) {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-2);
  padding-bottom: 4px;
}
</style>
