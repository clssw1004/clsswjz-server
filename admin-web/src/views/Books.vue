<template>
  <section class="glass page fade-in">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="账本名称"
        clearable
        :prefix-icon="Search"
        class="kw-input"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">
        <el-icon style="margin-right: 6px"><Search /></el-icon>
        查询
      </el-button>
      <span class="toolbar-total">共 <b class="num">{{ total }}</b> 个账本</span>
    </div>

    <!-- 账本表格 -->
    <div class="table-scroll table-only">
      <el-table
        :data="books"
        :header-cell-style="{ background: 'transparent' }"
        @row-click="(row: any) => $router.push(`/books/${row.id}`)"
      >
        <el-table-column label="账本" min-width="180">
          <template #default="{ row }">
            <div class="cell-book">
              <span class="cell-avatar">{{ avatarText(row.name) }}</span>
              <div class="cell-main">
                <div class="cell-name">{{ row.name }}</div>
                <div class="cell-id num">{{ row.id.slice(0, 8) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所有者" min-width="120">
          <template #default="{ row }">{{ row.ownerName }}</template>
        </el-table-column>
        <el-table-column label="成员" width="90" align="right">
          <template #default="{ row }">
            <el-tag effect="plain" size="small" class="num">{{ row.memberCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="记账笔数" width="110" align="right">
          <template #default="{ row }">
            <span class="num">{{ row.itemCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }">
            <span class="num" style="font-size: 13px">{{ fmt(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="" width="48" align="right">
          <template #default>
            <el-icon class="cell-arrow"><ArrowRight /></el-icon>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 账本卡片（移动端） -->
    <div class="m-list card-only">
      <div
        v-for="b in books"
        :key="b.id"
        class="m-card m-card-tap"
        @click="$router.push(`/books/${b.id}`)"
      >
        <div class="m-card-head">
          <span class="mc-avatar">{{ avatarText(b.name) }}</span>
          <div class="m-card-main">
            <div class="m-card-title">{{ b.name }}</div>
            <div class="m-card-sub num">{{ b.id.slice(0, 8) }}</div>
          </div>
          <el-tag effect="plain" size="small" class="num">{{ b.itemCount }} 笔</el-tag>
        </div>
        <div class="m-card-foot">
          <span>所有者 · {{ b.ownerName }}</span>
          <span class="val">{{ b.memberCount }} 成员</span>
        </div>
      </div>
    </div>

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
import { Search, ArrowRight } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { useIsMobile } from '../composables/useIsMobile';

const books = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const keyword = ref('');
const isMobile = useIsMobile();

function avatarText(name: string) {
  return (name || '?').slice(0, 1).toUpperCase();
}
function fmt(t: number | null | undefined) {
  return t ? new Date(Number(t)).toLocaleString() : '—';
}
async function search() {
  page.value = 1;
  await load();
}
async function load() {
  const data = await adminApi.books({
    page: page.value,
    pageSize,
    keyword: keyword.value || undefined,
  });
  books.value = data.items;
  total.value = data.total;
}
onMounted(load);
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
.kw-input {
  width: 240px;
}
.toolbar-total {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-3);
}
.toolbar-total b {
  color: var(--text-1);
  font-size: 15px;
}
.cell-book {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cell-avatar,
.mc-avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(139, 92, 246, 0.12));
  color: var(--brand-purple-light);
  font-weight: 600;
  border: 1px solid rgba(139, 92, 246, 0.3);
}
.mc-avatar {
  width: 42px;
  height: 42px;
  font-size: 16px;
}
.cell-main {
  min-width: 0;
}
.cell-name {
  font-weight: 500;
  color: var(--text-1);
}
.cell-id {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}
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
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
@media (max-width: 640px) {
  .kw-input {
    width: 100%;
  }
  .pager {
    justify-content: center;
  }
}
</style>
