<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="min(760px, 94vw)"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
  >
    <div class="table-scroll">
      <el-table
        :data="items"
        size="small"
        max-height="56vh"
        :header-cell-style="{ background: 'transparent' }"
        @row-click="goItem"
      >
        <el-table-column label="日期" width="120">
          <template #default="{ row }">
            <span class="num" style="font-size: 12px">{{ fmtDate(row.accountDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="76">
          <template #default="{ row }">
            <el-tag :type="row.type === 'EXPENSE' ? 'danger' : 'success'" effect="dark" size="small" round>
              {{ row.type === 'EXPENSE' ? '支出' : '收入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="num" :class="row.type === 'EXPENSE' ? 'is-expense' : 'is-income'">
              {{ row.type === 'EXPENSE' ? '−' : '+' }}{{ fmtAmount(Math.abs(row.amount)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="分类" min-width="96">
          <template #default="{ row }">{{ row.categoryName ?? row.categoryCode ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="商户" min-width="96">
          <template #default="{ row }">{{ row.shopName ?? row.shopCode ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="账户" min-width="96">
          <template #default="{ row }">{{ row.fundName ?? row.fundId ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="描述" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '—' }}</template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="load"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api/admin';
import { fmtAmount } from '../styles/chart-theme';

/** 账目明细筛选（任意维度组合） */
export interface ItemFilters {
  type?: string;
  categoryCodes?: string;
  fundIds?: string;
  shopCodes?: string;
  month?: string;
}

const props = withDefaults(
  defineProps<{
    visible: boolean;
    bookId: string;
    title: string;
    filters?: ItemFilters;
  }>(),
  { filters: () => ({}) },
);
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>();

const router = useRouter();
const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;

function fmtDate(t: number | string | null | undefined) {
  if (!t) return '—';
  const d = typeof t === 'number' ? new Date(t) : new Date(Number(t));
  if (isNaN(d.getTime())) return String(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function load() {
  if (!props.visible || !props.bookId) return;
  const data = await adminApi.items({
    bookId: props.bookId,
    page: page.value,
    pageSize,
    ...props.filters,
  });
  items.value = data.items;
  total.value = data.total;
}

function goItem(row: any) {
  emit('update:visible', false);
  router.push(`/items/${row.id}`);
}

// 打开弹窗或筛选变化时重置并加载
watch(
  () => [props.visible, props.bookId, JSON.stringify(props.filters)],
  () => {
    page.value = 1;
    load();
  },
);
</script>

<style scoped>
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.is-expense { color: var(--brand-red-light); }
.is-income { color: var(--color-success); }
</style>
