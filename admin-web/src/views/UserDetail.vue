<template>
  <div class="detail">
    <!-- 返回 -->
    <button class="back-btn" type="button" @click="$router.back()">
      <el-icon :size="16"><ArrowLeft /></el-icon>
      返回列表
    </button>

    <!-- 用户信息 -->
    <section class="glass profile fade-in">
      <div class="profile-avatar">{{ avatarText }}</div>
      <div class="profile-main">
        <div class="profile-name">{{ user?.nickname || user?.username || '—' }}</div>
        <div class="profile-id num">@{{ user?.username }}</div>
        <div class="profile-meta">
          <span>注册于 {{ fmt(user?.createdAt) }}</span>
        </div>
      </div>
      <div class="profile-stats">
        <div class="pstat">
          <span class="pstat-label">日志数</span>
          <span class="pstat-value num">{{ stats?.logCount ?? '—' }}</span>
        </div>
        <div class="pstat">
          <span class="pstat-label">最近同步</span>
          <span class="pstat-value num small">{{ fmt(stats?.lastSyncTime) }}</span>
        </div>
      </div>
    </section>

    <!-- 账本 -->
    <section class="glass panel fade-in" style="--d: 90ms">
      <header class="panel-head">
        <div class="panel-title">参与账本</div>
        <el-tag effect="plain" size="small" class="num">{{ books.length }} 个</el-tag>
      </header>
      <div v-if="books.length" class="book-grid">
        <div v-for="b in books" :key="b.id" class="book-chip glass-hover">
          <span class="book-dot" aria-hidden="true" />
          <span class="book-name">{{ b.name }}</span>
          <span class="book-id num">{{ b.id.slice(0, 8) }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无参与账本" :image-size="60" />
    </section>

    <!-- 记账明细 -->
    <section class="glass panel fade-in" style="--d: 140ms">
      <header class="panel-head">
        <div class="panel-title">记账明细</div>
      </header>
      <div class="table-scroll table-only">
        <el-table :data="items" :header-cell-style="{ background: 'transparent' }">
          <el-table-column label="日期" width="120">
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
        </el-table>
      </div>

      <!-- 记账明细卡片（移动端） -->
      <div class="m-list card-only">
        <div v-for="i in items" :key="i.id" class="m-card">
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

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="itemTotal"
          :layout="isMobile ? 'prev, pager, next' : 'total, prev, pager, next'"
          :pager-count="isMobile ? 5 : 7"
          background
          @current-change="loadItems"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { fmtAmount } from '../styles/chart-theme';
import { useIsMobile } from '../composables/useIsMobile';

const route = useRoute();
const id = route.params.id as string;
const user = ref<any>(null);
const stats = ref<any>(null);
const books = ref<any[]>([]);
const items = ref<any[]>([]);
const itemTotal = ref(0);
const page = ref(1);
const pageSize = 20;
const isMobile = useIsMobile();

const avatarText = computed(() =>
  (user.value?.nickname || user.value?.username || '?').slice(0, 1).toUpperCase(),
);

function fmt(t: number | null | undefined) {
  return t ? new Date(Number(t)).toLocaleString() : '—';
}
function fmtDate(t: number | string | null | undefined) {
  if (!t) return '—';
  const d = typeof t === 'number' ? new Date(t) : new Date(Number(t));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function loadItems() {
  const data = await adminApi.userItems(id, { page: page.value, pageSize });
  items.value = data.items;
  itemTotal.value = data.total;
}

onMounted(async () => {
  const detail = await adminApi.userDetail(id);
  user.value = detail.user;
  stats.value = detail.stats;
  books.value = await adminApi.userBooks(id);
  await loadItems();
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

/* 用户信息 */
.profile {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  flex-wrap: wrap;
}
.profile-avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: var(--grad-purple);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}
.profile-main {
  min-width: 0;
  flex: 1;
}
.profile-name {
  font-size: 20px;
  font-weight: 700;
}
.profile-id {
  font-size: 13px;
  color: var(--text-3);
  margin-top: 3px;
}
.profile-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 8px;
}
.profile-stats {
  display: flex;
  gap: 32px;
  padding-left: 24px;
  border-left: 1px solid var(--border-glass);
}
.pstat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pstat-label {
  font-size: 12px;
  color: var(--text-3);
}
.pstat-value {
  font-size: 22px;
  font-weight: 700;
}
.pstat-value.small {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  align-self: center;
}

/* 面板 */
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

/* 账本 chips */
.book-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.book-chip {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  border-radius: 12px;
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  cursor: default;
}
.book-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--grad-gold);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}
.book-name {
  font-size: 14px;
  font-weight: 500;
}
.book-id {
  font-size: 11px;
  color: var(--text-3);
}

/* 金额 */
.amount {
  font-weight: 600;
}
.amount.is-expense { color: var(--brand-red-light); }
.amount.is-income { color: var(--color-success); }

/* 移动端卡片 */
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
  .profile {
    gap: 14px;
    padding: 16px;
  }
  .profile-stats {
    width: 100%;
    padding: 14px 0 0;
    border-left: none;
    border-top: 1px solid var(--border-glass);
    gap: 24px;
  }
  .pager {
    justify-content: center;
  }
}
</style>
