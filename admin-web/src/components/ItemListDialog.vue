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
        @sort-change="onSortChange"
      >
        <el-table-column
          prop="accountDate"
          label="日期"
          width="120"
          sortable="custom"
        >
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
        <el-table-column
          prop="amount"
          label="金额"
          width="120"
          align="right"
          sortable="custom"
        >
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
import { fmtAmount, fmtDate } from '../styles/chart-theme';

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
const sortBy = ref('');
const sortOrder = ref<'ASC' | 'DESC' | ''>('');

async function load() {
  if (!props.visible || !props.bookId) return;
  const data = await adminApi.items({
    bookId: props.bookId,
    page: page.value,
    pageSize,
    ...props.filters,
    sortBy: sortBy.value || undefined,
    sortOrder: sortOrder.value || undefined,
  });
  items.value = data.items;
  total.value = data.total;
}

function goItem(row: any) {
  emit('update:visible', false);
  router.push(`/items/${row.id}`);
}

/** 表头排序：日期/金额列可点击，触发后端全量排序 */
function onSortChange({ prop, order }: { prop: string; order: string }) {
  if (!prop || !order) {
    sortBy.value = '';
    sortOrder.value = '';
  } else {
    sortBy.value = prop;
    sortOrder.value = order === 'ascending' ? 'ASC' : 'DESC';
  }
  page.value = 1;
  load();
}

// 打开弹窗或筛选变化时重置并加载（同时清空排序）
watch(
  () => [props.visible, props.bookId, JSON.stringify(props.filters)],
  () => {
    page.value = 1;
    sortBy.value = '';
    sortOrder.value = '';
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
