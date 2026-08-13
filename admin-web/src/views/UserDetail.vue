<template>
  <div>
    <el-page-header @back="$router.back()" content="用户详情" />

    <el-card style="margin-top: 16px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">
          {{ user?.username }}
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ user?.nickname }}
        </el-descriptions-item>
        <el-descriptions-item label="日志数">
          {{ stats?.logCount }}
        </el-descriptions-item>
        <el-descriptions-item label="最近同步">
          {{ fmt(stats?.lastSyncTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 16px" header="账本">
      <el-table :data="books">
        <el-table-column prop="name" label="账本名" />
        <el-table-column prop="id" label="ID" />
      </el-table>
    </el-card>

    <el-card style="margin-top: 16px" header="记账明细">
      <el-table :data="items">
        <el-table-column prop="accountDate" label="日期" width="180" />
        <el-table-column prop="type" label="类型" width="90" />
        <el-table-column prop="amount" label="金额" />
        <el-table-column label="分类">
          <template #default="{ row }">
            {{ row.categoryName ?? row.categoryCode }}
          </template>
        </el-table-column>
        <el-table-column label="商户">
          <template #default="{ row }">
            {{ row.shopName ?? row.shopCode ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="账户">
          <template #default="{ row }">
            {{ row.fundName ?? row.fundId ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="itemTotal"
        layout="total, prev, pager, next"
        style="margin-top: 12px"
        @current-change="loadItems"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { adminApi } from '../api/admin';

const route = useRoute();
const id = route.params.id as string;
const user = ref<any>(null);
const stats = ref<any>(null);
const books = ref<any[]>([]);
const items = ref<any[]>([]);
const itemTotal = ref(0);
const page = ref(1);
const pageSize = 20;

function fmt(t: number | null | undefined) {
  return t ? new Date(Number(t)).toLocaleString() : '-';
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
