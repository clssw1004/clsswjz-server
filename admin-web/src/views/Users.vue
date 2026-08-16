<template>
  <section class="glass page fade-in">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="用户名 / 昵称"
        clearable
        :prefix-icon="Search"
        class="kw-input"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">
        <el-icon style="margin-right: 6px"><Search /></el-icon>
        查询
      </el-button>
      <span class="toolbar-total">共 <b class="num">{{ total }}</b> 位用户</span>
    </div>

    <!-- 用户表格（桌面端） -->
    <div class="table-scroll table-only">
      <el-table
        :data="users"
        :header-cell-style="{ background: 'transparent' }"
        @row-click="(row: any) => $router.push(`/users/${row.id}`)"
      >
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="cell-user">
              <span class="cell-avatar" :class="avatarGrad(row.nickname || row.username)">{{ avatarText(row.nickname || row.username) }}</span>
              <div class="cell-user-main">
                <div class="cell-name">{{ row.nickname || row.username }}</div>
                <div class="cell-id num">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="logCount" label="日志数" width="120">
          <template #default="{ row }">
            <el-tag effect="plain" size="small" class="num">{{ row.logCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近同步" min-width="180">
          <template #default="{ row }">
            <span class="num" style="font-size: 13px">{{ fmt(row.lastSyncTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="" width="48" align="right">
          <template #default>
            <el-icon class="cell-arrow"><ArrowRight /></el-icon>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 用户卡片（移动端） -->
    <div class="m-list card-only">
      <div
        v-for="u in users"
        :key="u.id"
        class="m-card m-card-tap"
        @click="$router.push(`/users/${u.id}`)"
      >
        <div class="m-card-head">
          <span class="mc-avatar" :class="avatarGrad(u.nickname || u.username)">{{ avatarText(u.nickname || u.username) }}</span>
          <div class="m-card-main">
            <div class="m-card-title">{{ u.nickname || u.username }}</div>
            <div class="m-card-sub num">@{{ u.username }}</div>
          </div>
          <el-tag effect="plain" size="small" class="num">{{ u.logCount }} 条日志</el-tag>
        </div>
        <div class="m-card-foot">
          <span>最近同步</span>
          <span class="val">{{ fmt(u.lastSyncTime) }}</span>
        </div>
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
import { Search, ArrowRight } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { useIsMobile } from '../composables/useIsMobile';
import { avatarGrad } from '../styles/themes';

const users = ref<any[]>([]);
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
  const data = await adminApi.users({
    page: page.value,
    pageSize,
    keyword: keyword.value || undefined,
  });
  users.value = data.items;
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
  width: 260px;
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

/* 用户单元格 */
.cell-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cell-avatar,
.mc-avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.28);
}
.cell-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 14px;
}
.mc-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  font-size: 16px;
}
.cell-avatar.grad-gold,
.mc-avatar.grad-gold { background: var(--grad-gold); color: var(--on-primary); }
.cell-avatar.grad-purple,
.mc-avatar.grad-purple { background: var(--grad-purple); }
.cell-avatar.grad-green,
.mc-avatar.grad-green { background: var(--grad-green); }
.cell-avatar.grad-cyan,
.mc-avatar.grad-cyan { background: var(--grad-cyan); }
.cell-avatar.grad-red,
.mc-avatar.grad-red { background: var(--grad-red); }
.cell-user-main {
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
.cell-avatar + .cell-user-main .cell-name {
  color: var(--text-1);
}

/* 行点击反馈 */
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
  .toolbar-total {
    margin-left: 0;
  }
  .pager {
    justify-content: center;
  }
}
</style>
