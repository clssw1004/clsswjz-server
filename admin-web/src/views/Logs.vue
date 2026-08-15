<template>
  <section class="glass page fade-in">
    <!-- 过滤工具栏 -->
    <div class="filters">
      <el-input v-model="filters.operatorId" placeholder="操作人 ID" clearable class="f-item w-id" @keyup.enter="search" />
      <el-select v-model="filters.businessType" placeholder="业务类型" clearable class="f-item">
        <el-option v-for="b in businessTypes" :key="b" :label="b" :value="b" />
      </el-select>
      <el-select v-model="filters.operateType" placeholder="操作类型" clearable class="f-item">
        <el-option label="CREATE 新增" value="CREATE" />
        <el-option label="UPDATE 更新" value="UPDATE" />
        <el-option label="DELETE 删除" value="DELETE" />
      </el-select>
      <el-select v-model="filters.syncState" placeholder="同步状态" clearable class="f-item">
        <el-option label="SYNCED 已同步" value="SYNCED" />
        <el-option label="FAILED 失败" value="FAILED" />
        <el-option label="PENDING 待同步" value="PENDING" />
      </el-select>
      <el-button type="primary" @click="search">
        <el-icon style="margin-right: 6px"><Search /></el-icon>
        查询
      </el-button>
      <span class="filter-total">共 <b class="num">{{ total }}</b> 条日志</span>
    </div>

    <!-- 日志表格（桌面端） -->
    <div class="table-scroll table-only">
      <el-table
        :data="logs"
        :header-cell-style="{ background: 'transparent' }"
        @row-click="showDetail"
      >
        <el-table-column label="操作时间" width="168">
          <template #default="{ row }">
            <span class="num" style="font-size: 13px">{{ fmt(row.operatedAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" min-width="130">
          <template #default="{ row }">
            <div class="op-cell">
              <span class="op-name">{{ row.operatorName ?? row.operatorId }}</span>
              <span class="op-id num">{{ row.operatorId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务" width="120">
          <template #default="{ row }">
            <el-tag effect="plain" size="small">{{ row.businessType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="92">
          <template #default="{ row }">
            <span class="op-type" :class="`op-${row.operateType?.toLowerCase()}`">
              {{ opLabel(row.operateType) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="账本" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span :title="row.parentId">{{ row.parentBookName ?? row.parentId ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="104">
          <template #default="{ row }">
            <el-tag :type="stateType(row.syncState)" effect="dark" size="small" round>
              {{ row.syncState }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 日志卡片（移动端） -->
    <div class="m-list card-only">
      <div
        v-for="l in logs"
        :key="l.id"
        class="m-card m-card-tap"
        @click="showDetail(l)"
      >
        <div class="m-card-head">
          <el-tag :type="stateType(l.syncState)" effect="dark" size="small" round>
            {{ l.syncState }}
          </el-tag>
          <span class="op-type" :class="`op-${l.operateType?.toLowerCase()}`">
            {{ opLabel(l.operateType) }}
          </span>
          <div class="m-card-main" style="text-align: right">
            <el-tag effect="plain" size="small">{{ l.businessType }}</el-tag>
          </div>
        </div>
        <div class="m-card-title">{{ l.operatorName ?? l.operatorId }}</div>
        <div class="m-card-sub num">{{ fmt(l.operatedAt) }}</div>
        <div class="m-card-foot">
          <span>账本</span>
          <span class="val" style="text-align: right">{{ l.parentBookName ?? l.parentId ?? '—' }}</span>
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

    <!-- 日志详情 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="min(720px, 92vw)">
      <template v-if="detail">
        <el-descriptions :column="isMobile ? 1 : 2" border size="small">
          <el-descriptions-item label="业务类型">{{ detail.businessType }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ detail.operateType }}</el-descriptions-item>
          <el-descriptions-item label="业务ID">
            <span class="num">{{ detail.businessId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            <span class="num">{{ fmt(detail.operatedAt) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            <span class="num">{{ detail.operatorName ?? detail.operatorId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="同步状态">
            <el-tag :type="stateType(detail.syncState)" effect="dark" size="small" round>
              {{ detail.syncState }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <LogChangeView :log="detail" :show-header="false" :name-map="detail.nameMap" />
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { useIsMobile } from '../composables/useIsMobile';
import LogChangeView from '../components/LogChangeView.vue';

const logs = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const filters = ref<Record<string, string>>({});
const detailVisible = ref(false);
const detail = ref<any>(null);
const isMobile = useIsMobile();

const businessTypes = [
  'BOOK', 'ITEM', 'CATEGORY', 'FUND', 'SHOP', 'SYMBOL',
  'USER', 'BOOK_MEMBER', 'ATTACHMENT',
];

const opLabels: Record<string, string> = {
  CREATE: '新增',
  UPDATE: '更新',
  DELETE: '删除',
};
const stateTypes: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  SYNCED: 'success',
  FAILED: 'danger',
  PENDING: 'warning',
};

function opLabel(t?: string) {
  return t ? `${opLabels[t] ?? t} ${t}`.trim() : '—';
}
function stateType(s?: string) {
  return stateTypes[s ?? ''] ?? 'info';
}
function fmt(t: number) {
  return t ? new Date(Number(t)).toLocaleString() : '—';
}

async function search() {
  page.value = 1;
  await load();
}

async function load() {
  const params: Record<string, unknown> = { page: page.value, pageSize };
  for (const [k, v] of Object.entries(filters.value)) {
    if (v) params[k] = v;
  }
  const data = await adminApi.logs(params);
  logs.value = data.items;
  total.value = data.total;
}

async function showDetail(row: any) {
  const d = await adminApi.logDetail(row.id);
  detail.value = d;
  detailVisible.value = true;
}

onMounted(load);
</script>

<style scoped>
.page {
  padding: 20px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.f-item {
  width: 170px;
}
.f-item.w-id {
  width: 200px;
}
.filter-total {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-3);
}
.filter-total b {
  color: var(--text-1);
  font-size: 15px;
  margin: 0 2px;
}

.op-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.op-name {
  font-weight: 500;
}
.op-id {
  font-size: 11px;
  color: var(--text-3);
}

.op-type {
  font-size: 12px;
  font-weight: 600;
}
.op-create { color: var(--color-success); }
.op-update { color: var(--brand-gold); }
.op-delete { color: var(--brand-red-light); }

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 640px) {
  .f-item,
  .f-item.w-id {
    width: 100%;
  }
  .filter-total {
    margin-left: 0;
  }
  .pager {
    justify-content: center;
  }
}
</style>
