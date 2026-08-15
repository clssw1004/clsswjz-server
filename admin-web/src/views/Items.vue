<template>
  <section class="glass page fade-in">
    <!-- 账本选择 + 工具栏 -->
    <div class="toolbar">
      <el-select
        v-model="bookId"
        filterable
        size="default"
        placeholder="选择账本"
        :prefix-icon="Notebook"
        style="width: 280px; max-width: 100%"
        @change="search"
      >
        <el-option v-for="b in books" :key="b.id" :label="b.name" :value="b.id">
          <span>{{ b.name }}</span>
          <span class="book-opt-id num">{{ b.id.slice(0, 8) }}</span>
        </el-option>
      </el-select>
      <span class="toolbar-total">共 <b class="num">{{ total }}</b> 笔账目</span>
    </div>

    <!-- 账目表格 -->
    <div class="table-scroll table-only">
      <el-table
        :data="items"
        :header-cell-style="{ background: 'transparent' }"
        @row-click="(row: any) => $router.push(`/items/${row.id}`)"
      >
        <el-table-column label="日期" width="130">
          <template #default="{ row }">
            <span class="num" style="font-size: 13px">{{ fmtDate(row.accountDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type === 'EXPENSE' ? 'danger' : 'success'" effect="dark" size="small" round>
              {{ row.type === 'EXPENSE' ? '支出' : '收入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="130">
          <template #default="{ row }">
            <span class="num amount" :class="row.type === 'EXPENSE' ? 'is-expense' : 'is-income'">
              {{ row.type === 'EXPENSE' ? '−' : '+' }}{{ fmtAmount(Math.abs(row.amount)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="分类" min-width="110">
          <template #default="{ row }">
            {{ row.categoryName ?? row.categoryCode ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="商户" min-width="110">
          <template #default="{ row }">
            {{ row.shopName ?? row.shopCode ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="账户" min-width="110">
          <template #default="{ row }">
            {{ row.fundName ?? row.fundId ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="描述" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="" width="48" align="right">
          <template #default>
            <el-icon class="cell-arrow"><ArrowRight /></el-icon>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 账目卡片（移动端） -->
    <div class="m-list card-only">
      <div
        v-for="i in items"
        :key="i.id"
        class="m-card m-card-tap"
        @click="$router.push(`/items/${i.id}`)"
      >
        <div class="m-card-head">
          <el-tag :type="i.type === 'EXPENSE' ? 'danger' : 'success'" effect="dark" size="small" round>
            {{ i.type === 'EXPENSE' ? '支出' : '收入' }}
          </el-tag>
          <div class="m-card-main">
            <div class="m-card-title">{{ i.categoryName ?? i.categoryCode ?? '未分类' }}</div>
            <div class="m-card-sub num">{{ fmtDate(i.accountDate) }}</div>
          </div>
          <span
            class="num mc-amount"
            :class="i.type === 'EXPENSE' ? 'is-expense' : 'is-income'"
          >
            {{ i.type === 'EXPENSE' ? '−' : '+' }}{{ fmtAmount(Math.abs(i.amount)) }}
          </span>
        </div>
        <div class="m-card-foot">
          <span>商户 · {{ i.shopName ?? i.shopCode ?? '—' }}</span>
          <span class="val">账户 · {{ i.fundName ?? i.fundId ?? '—' }}</span>
        </div>
        <div v-if="i.description" class="mc-desc">{{ i.description }}</div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        :layout="isMobile ? 'prev, pager, next' : 'total, prev, pager, next'"
        :pager-count="isMobile ? 5 : 7"
        background
        @current-change="load"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Notebook, ArrowRight } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { useIsMobile } from '../composables/useIsMobile';
import { useBookFilter } from '../composables/useBookFilter';
import { fmtAmount } from '../styles/chart-theme';

const { books, bookId, loadBooks } = useBookFilter();
const isMobile = useIsMobile();

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

async function search() {
  page.value = 1;
  await load();
}

async function load() {
  if (!bookId.value) return;
  const data = await adminApi.items({
    bookId: bookId.value,
    page: page.value,
    pageSize,
  });
  items.value = data.items;
  total.value = data.total;
}

onMounted(async () => {
  await loadBooks();
  await load();
});
</script>

<style scoped>
.page {
  padding: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.book-opt-id {
  float: right;
  margin-left: 14px;
  font-size: 11px;
  color: var(--text-3);
}
.toolbar-total {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-3);
}
.toolbar-total b {
  color: var(--text-1);
  font-size: 15px;
  margin: 0 2px;
}

.amount {
  font-weight: 600;
}
.amount.is-expense { color: var(--brand-red-light); }
.amount.is-income { color: var(--color-success); }

.cell-arrow {
  color: var(--text-3);
  transition: transform 0.2s ease, color 0.2s ease;
}
.page :deep(.el-table__row) {
  cursor: pointer;
}
.page :deep(.el-table__row:hover .cell-arrow) {
  color: var(--brand-gold);
  transform: translateX(3px);
}

.mc-amount {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}
.mc-amount.is-expense { color: var(--brand-red-light); }
.mc-amount.is-income { color: var(--color-success); }
.mc-desc {
  margin-top: 10px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--text-2);
  background: var(--surface-glass);
  border-radius: var(--radius-sm);
  word-break: break-all;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
@media (max-width: 640px) {
  .pager {
    justify-content: center;
  }
}
</style>
