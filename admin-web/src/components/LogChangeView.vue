<template>
  <div class="log-change-view">
    <!-- 头部：操作标签 + 操作人 + 时间 -->
    <div v-if="showHeader" class="lch-head">
      <el-tag :type="opType" effect="dark" size="small" round>{{ opLabel }}</el-tag>
      <span v-if="showOperator" class="lch-operator">{{ operatorDisplay }}</span>
      <span v-if="showTime && operatedAt" class="lch-time num">{{ fmtTime(operatedAt) }}</span>
    </div>

    <!-- 字段变更：新增 / 修改 -->
    <div v-if="changeFields.length" class="lch-fields">
      <div
        v-for="f in changeFields"
        :key="f.key"
        class="lch-field"
        :class="`kind-${f.kind}`"
      >
        <span class="lch-label">{{ f.label }}</span>
        <span class="lch-tag">{{ f.kind === 'added' ? '新增' : '修改' }}</span>
        <span v-if="f.kind === 'modified'" class="lch-old">{{ f.oldDisplay }}</span>
        <span v-if="f.kind === 'modified'" class="lch-arrow">→</span>
        <span class="lch-new">{{ f.newDisplay }}</span>
      </div>
    </div>
    <div v-else-if="note" class="lch-note">{{ note }}</div>

    <!-- 原始数据 -->
    <details class="lch-raw">
      <summary>原始数据</summary>
      <pre>{{ prettyJson }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { fmtAmount } from '../styles/chart-theme';

export interface LogNameMap {
  categories: Record<string, string>;
  shops: Record<string, string>;
  funds: Record<string, string>;
}

const props = withDefaults(
  defineProps<{
    /** 日志对象：{ operateType, operateData, operatorId?, operatorName?, operatedAt? } */
    log: any;
    /** 分类/商户/账户 编码 → 名称 映射 */
    nameMap?: LogNameMap;
    /** 变更前状态快照：提供后能显示「修改 旧值 → 新值」 */
    prev?: any;
    showHeader?: boolean;
    showOperator?: boolean;
    showTime?: boolean;
  }>(),
  {
    nameMap: () => ({ categories: {}, shops: {}, funds: {} }),
    prev: () => ({}),
    showHeader: true,
    showOperator: true,
    showTime: false,
  },
);

const OP_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  batch_create: '批量创建',
  batch_update: '批量更新',
  batch_delete: '批量删除',
};
const OP_TYPES: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
  create: 'success',
  update: 'primary',
  delete: 'danger',
  batch_create: 'success',
  batch_update: 'warning',
  batch_delete: 'danger',
};
const FIELD_LABELS: Record<string, string> = {
  amount: '金额',
  description: '描述',
  type: '类型',
  categoryCode: '分类',
  accountDate: '日期',
  fundId: '账户',
  shopCode: '商户',
  projectCode: '项目',
  source: '来源',
  sourceId: '来源ID',
};
const TYPE_LABELS: Record<string, string> = {
  EXPENSE: '支出',
  INCOME: '收入',
};
const META_KEYS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'parentId',
  'lastAccountItemAt',
  'accountBookId',
]);

const opKey = computed(() => (props.log.operateType || '').toLowerCase());
const opLabel = computed(() => {
  const k = opKey.value;
  const raw = props.log.operateType;
  return OP_LABELS[k]
    ? `${OP_LABELS[k]}${raw !== k ? ` ${raw}` : ''}`
    : raw || '—';
});
const opType = computed(() => OP_TYPES[opKey.value] ?? 'info');
const operatorDisplay = computed(
  () => props.log.operatorName || props.log.operatorId || '',
);
const operatedAt = computed(() => props.log.operatedAt);
const data = computed(() =>
  props.log.operateData && typeof props.log.operateData === 'object'
    ? props.log.operateData
    : {},
);

function fmtTime(t: number | null | undefined): string {
  return t ? new Date(Number(t)).toLocaleString() : '—';
}
function displayValue(field: string, v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  if (field === 'amount') return `¥${fmtAmount(Math.abs(Number(v)))}`;
  if (field === 'type') return TYPE_LABELS[v] ?? String(v);
  if (field === 'categoryCode') return props.nameMap.categories[v] ?? String(v);
  if (field === 'shopCode') return props.nameMap.shops[v] ?? String(v);
  if (field === 'fundId') return props.nameMap.funds[v] ?? String(v);
  if (v === true) return '是';
  if (v === false) return '否';
  return String(v);
}

/** 字段变更列表：create → 全部「新增」；update → 对比 prev 区分「修改/新增」 */
const changeFields = computed(() => {
  const k = opKey.value;
  const d = data.value;
  if (k === 'delete' || k === 'batch_delete' || k === 'batch_update') return [];
  const fields: Array<{
    key: string;
    label: string;
    kind: 'added' | 'modified';
    newDisplay: string;
    oldDisplay?: string;
  }> = [];
  for (const [key, val] of Object.entries(d)) {
    if (META_KEYS.has(key)) continue;
    if (val === undefined || val === null || val === '') continue;
    const label = FIELD_LABELS[key] ?? key;
    const newDisplay = displayValue(key, val);
    if (k === 'create') {
      fields.push({ key, label, kind: 'added', newDisplay });
      continue;
    }
    // update：对比上一状态
    const prevVal = props.prev ? props.prev[key] : undefined;
    const prevExists =
      prevVal !== undefined && prevVal !== null && prevVal !== '';
    const same = prevExists && String(prevVal) === String(val);
    if (same) continue;
    if (prevExists) {
      fields.push({
        key,
        label,
        kind: 'modified',
        oldDisplay: displayValue(key, prevVal),
        newDisplay,
      });
    } else {
      fields.push({ key, label, kind: 'added', newDisplay });
    }
  }
  return fields;
});

/** 无字段变更时的提示（如仅时间戳 / 批量更新） */
const note = computed(() => {
  const k = opKey.value;
  if (k === 'delete') return '删除';
  if (k === 'batch_delete') return '批量删除';
  if (k === 'batch_update') return '批量更新（排序/字段调整）';
  if (k === 'update' && changeFields.value.length === 0) return '更新（仅时间戳）';
  return '';
});

const prettyJson = computed(() => {
  try {
    return JSON.stringify(props.log.operateData ?? {}, null, 2);
  } catch {
    return String(props.log.operateData ?? '');
  }
});
</script>

<style scoped>
.log-change-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.lch-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.lch-operator {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
}
.lch-time {
  font-size: 12px;
  color: var(--text-3);
}

/* 字段变更列表 */
.lch-fields {
  display: flex;
  flex-direction: column;
}
.lch-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.lch-field + .lch-field {
  border-top: 1px solid var(--border-glass);
}
.lch-field:hover {
  background: var(--surface-glass);
}
.lch-label {
  width: 60px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-2);
}
.lch-tag {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.kind-added .lch-tag {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
}
.kind-modified .lch-tag {
  background: rgba(245, 158, 11, 0.15);
  color: var(--brand-gold);
}
.lch-old {
  font-size: 12px;
  color: var(--text-3);
  text-decoration: line-through;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lch-arrow {
  color: var(--text-3);
  flex-shrink: 0;
}
.lch-new {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  word-break: break-all;
  min-width: 0;
}

.lch-note {
  font-size: 13px;
  color: var(--text-1);
}

.lch-raw {
  font-size: 12px;
  color: var(--text-2);
}
.lch-raw summary {
  cursor: pointer;
  color: var(--text-3);
  font-size: 12px;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.lch-raw summary::before {
  content: '▸';
  transition: transform 0.15s ease;
}
.lch-raw[open] summary::before {
  transform: rotate(90deg);
}
.lch-raw pre {
  margin: 8px 0 0;
  padding: 10px 12px;
  max-height: 220px;
  overflow: auto;
  background: var(--code-bg);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-2);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
