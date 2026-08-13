<template>
  <el-card>
    <el-form inline>
      <el-form-item>
        <el-input v-model="filters.operatorId" placeholder="操作人ID" clearable />
      </el-form-item>
      <el-form-item>
        <el-input v-model="filters.businessType" placeholder="业务类型" clearable />
      </el-form-item>
      <el-form-item>
        <el-input v-model="filters.operateType" placeholder="操作类型" clearable />
      </el-form-item>
      <el-form-item>
        <el-input v-model="filters.syncState" placeholder="同步状态" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="logs" style="cursor: pointer" @row-click="showDetail">
      <el-table-column prop="operatedAt" label="操作时间" width="190">
        <template #default="{ row }">{{ fmt(row.operatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作人" width="150">
        <template #default="{ row }">
          <span :title="row.operatorId">{{ row.operatorName ?? row.operatorId }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="businessType" label="业务类型" width="110" />
      <el-table-column prop="operateType" label="操作" width="100" />
      <el-table-column label="账本" width="180">
        <template #default="{ row }">
          <span :title="row.parentId">{{ row.parentBookName ?? row.parentId }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="syncState" label="状态" width="90" />
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top: 12px"
      @current-change="load"
    />

    <el-dialog v-model="detailVisible" title="日志详情" width="640px">
      <pre class="json-block">{{ detailJson }}</pre>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminApi } from '../api/admin';

const logs = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const filters = ref<Record<string, string>>({});
const detailVisible = ref(false);
const detailJson = ref('');

function fmt(t: number) {
  return t ? new Date(Number(t)).toLocaleString() : '-';
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
  detailJson.value = JSON.stringify(d, null, 2);
  detailVisible.value = true;
}

onMounted(load);
</script>

<style scoped>
.json-block {
  max-height: 60vh;
  overflow: auto;
  background: #f6f8fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
