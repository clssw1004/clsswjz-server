<template>
  <section class="glass page fade-in">
    <div class="toolbar">
      <el-select
        v-model="bookId"
        filterable
        placeholder="选择账本"
        :prefix-icon="Notebook"
        style="width: 260px; max-width: 100%"
        @change="search"
      >
        <el-option v-for="b in books" :key="b.id" :label="b.name" :value="b.id" />
      </el-select>
      <el-select v-model="type" placeholder="类型" clearable style="width: 140px" @change="search">
        <el-option label="笔记" value="NOTE" />
        <el-option label="待办" value="TODO" />
        <el-option label="报告" value="REPORT" />
      </el-select>
      <span class="toolbar-total">共 <b class="num">{{ total }}</b> 条记事</span>
    </div>

    <div class="table-scroll table-only">
      <el-table :data="notes" :header-cell-style="{ background: 'transparent' }" @row-click="showDetail">
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.noteType)" effect="plain" size="small" round>{{ typeLabel(row.noteType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ noteText(row.content).slice(0, 50) }}</template>
        </el-table-column>
        <el-table-column prop="createdByName" label="创建人" width="120" />
        <el-table-column label="更新时间" width="170">
          <template #default="{ row }"><span class="num" style="font-size: 13px">{{ fmt(row.updatedAt) }}</span></template>
        </el-table-column>
      </el-table>
    </div>

    <div class="m-list card-only">
      <div v-for="n in notes" :key="n.id" class="m-card m-card-tap" @click="showDetail(n)">
        <div class="m-card-head">
          <el-tag :type="typeTag(n.noteType)" effect="plain" size="small" round>{{ typeLabel(n.noteType) }}</el-tag>
          <div class="m-card-main">
            <div class="m-card-title">{{ n.title || '（无标题）' }}</div>
            <div class="m-card-sub num">{{ fmt(n.updatedAt) }} · {{ n.createdByName }}</div>
          </div>
        </div>
        <div v-if="n.content" class="m-card-sub" style="margin-top: 4px">{{ noteText(n.content).slice(0, 60) }}</div>
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

    <!-- 记事详情 -->
    <el-dialog v-model="detailVisible" :title="detail?.title || '记事详情'" width="min(560px, 92vw)">
      <template v-if="detail">
        <div class="nd-meta">
          <el-tag :type="typeTag(detail.noteType)" effect="plain" size="small" round>{{ typeLabel(detail.noteType) }}</el-tag>
          <span class="num" style="font-size: 12px; color: var(--text-3)">{{ detail.createdByName }} · {{ fmt(detail.updatedAt) }}</span>
        </div>
        <div class="nd-content">{{ renderedContent }}</div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Notebook } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';
import { useIsMobile } from '../composables/useIsMobile';
import { useBookFilter } from '../composables/useBookFilter';

const { books, bookId, loadBooks } = useBookFilter();
const isMobile = useIsMobile();
const notes = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const type = ref('');
const detailVisible = ref(false);
const detail = ref<any>(null);

const typeLabels: Record<string, string> = { NOTE: '笔记', TODO: '待办', REPORT: '报告' };
const typeTags: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  NOTE: 'primary',
  TODO: 'warning',
  REPORT: 'success',
};

function typeLabel(t?: string) {
  return t ? (typeLabels[t] ?? t) : '—';
}
function typeTag(t?: string) {
  return typeTags[t ?? ''] ?? 'info';
}
function fmt(t: number | null | undefined) {
  return t ? new Date(Number(t)).toLocaleString() : '—';
}

/** 记事内容为 Quill Delta JSON，解析提取纯文本（兼容纯文本） */
function noteText(content: any): string {
  if (!content) return '';
  let delta = content;
  if (typeof content === 'string') {
    try {
      delta = JSON.parse(content);
    } catch {
      return content; // 纯文本
    }
  }
  if (delta && typeof delta === 'object') {
    const ops = Array.isArray(delta.ops) ? delta.ops : Array.isArray(delta) ? delta : null;
    if (ops) {
      return ops
        .map((op: any) => (typeof op?.insert === 'string' ? op.insert : ''))
        .join('');
    }
  }
  return typeof delta === 'string' ? delta : '';
}

const renderedContent = computed(() => noteText(detail.value?.content));

async function search() {
  page.value = 1;
  await load();
}
async function load() {
  if (!bookId.value) return;
  const data = await adminApi.notes({
    bookId: bookId.value,
    type: type.value || undefined,
    page: page.value,
    pageSize,
  });
  notes.value = data.items;
  total.value = data.total;
}
async function showDetail(row: any) {
  detail.value = await adminApi.noteDetail(row.id);
  detailVisible.value = true;
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
.toolbar-total {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-3);
}
.toolbar-total b {
  color: var(--text-1);
  font-size: 15px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
.nd-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.nd-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-1);
  white-space: pre-wrap;
  word-break: break-all;
}
@media (max-width: 640px) {
  .toolbar-total {
    margin-left: 0;
  }
  .pager {
    justify-content: center;
  }
}
</style>
