<template>
  <el-card>
    <el-form inline>
      <el-form-item>
        <el-input
          v-model="keyword"
          placeholder="用户名/昵称"
          clearable
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="users"
      style="cursor: pointer"
      @row-click="(row: any) => $router.push(`/users/${row.id}`)"
    >
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="logCount" label="日志数" width="90" />
      <el-table-column prop="lastSyncTime" label="最近同步" width="200">
        <template #default="{ row }">{{ fmt(row.lastSyncTime) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top: 12px"
      @current-change="load"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminApi } from '../api/admin';

const users = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const keyword = ref('');

function fmt(t: number | null | undefined) {
  return t ? new Date(Number(t)).toLocaleString() : '-';
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
