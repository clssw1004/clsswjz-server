<template>
  <div class="detail">
    <button class="back-btn" type="button" @click="$router.back()">
      <el-icon :size="16"><ArrowLeft /></el-icon>
      返回账本列表
    </button>

    <!-- 账本信息 -->
    <section class="glass panel fade-in" v-if="detail">
      <div class="book-head">
        <span class="book-avatar">{{ avatarText(detail.book.name) }}</span>
        <div class="book-main">
          <div class="book-name">{{ detail.book.name }}</div>
          <div class="book-meta num">
            所有者 {{ detail.book.ownerName }} · 记账 {{ detail.itemCount }} 笔 ·
            创建 {{ fmt(detail.book.createdAt) }}
          </div>
        </div>
      </div>
      <div v-if="detail.book.description" class="book-desc">{{ detail.book.description }}</div>
      <div class="members">
        <span class="members-label">成员</span>
        <el-tag v-for="m in detail.members" :key="m.userId" effect="plain" size="small" round>
          {{ m.nickname || m.username || m.userId }}
        </el-tag>
        <el-tag v-if="!detail.members.length" effect="plain" size="small" round>仅创建者</el-tag>
      </div>
    </section>

    <!-- 数据维护 -->
    <section class="glass panel fade-in" style="--d: 90ms">
      <header class="panel-head">
        <div class="panel-title">数据字典维护</div>
      </header>
      <el-tabs v-model="activeTab" @tab-change="loadEntities">
        <el-tab-pane label="分类" name="category" />
        <el-tab-pane label="商户" name="shop" />
        <el-tab-pane label="标签/项目" name="symbol" />
      </el-tabs>

      <div class="mt-toolbar">
        <el-button type="primary" size="small" :disabled="selection.length !== 1" @click="openRename">
          重命名
        </el-button>
        <el-button type="danger" plain size="small" :disabled="!selection.length" @click="confirmDelete">
          删除
        </el-button>
        <el-button size="small" :disabled="selection.length < 1 || entities.length < 2" @click="mergeVisible = true">
          合并到…
        </el-button>
        <span class="mt-hint">变更通过日志同步，客户端下次同步生效（不直接改库）</span>
      </div>

      <!-- 不强制最小宽：4 列紧凑表格在移动端可自适应 -->
      <el-table
        :data="entities"
        size="small"
        :header-cell-style="{ background: 'transparent' }"
        @selection-change="onSelect"
      >
        <el-table-column type="selection" width="40" />
        <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="code" label="编码" width="120">
          <template #default="{ row }"><span class="num">{{ row.code }}</span></template>
        </el-table-column>
        <el-table-column prop="itemCount" label="引用笔数" width="96" align="right">
          <template #default="{ row }"><span class="num">{{ row.itemCount }}</span></template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!entities.length && loaded" description="该账本暂无数据" :image-size="60" />
    </section>

    <!-- 重命名弹窗 -->
    <el-dialog v-model="renameVisible" title="重命名" width="min(400px, 92vw)">
      <el-input v-model="renameName" placeholder="新名称" maxlength="50" @keyup.enter="doRename" />
      <div class="dlg-actions">
        <el-button @click="renameVisible = false">取消</el-button>
        <el-button type="primary" :loading="renaming" @click="doRename">确定</el-button>
      </div>
    </el-dialog>

    <!-- 合并弹窗 -->
    <el-dialog v-model="mergeVisible" title="合并" width="min(420px, 92vw)">
      <p class="merge-tip">将选中的 {{ selection.length }} 项合并到：</p>
      <el-select v-model="mergeTarget" filterable placeholder="选择目标项" style="width: 100%">
        <el-option v-for="e in mergeTargets" :key="e.id" :label="`${e.name}（${e.itemCount} 笔）`" :value="e.id" />
      </el-select>
      <p class="merge-note">合并后，选中项的账目引用会改指向目标项，源项被删除。</p>
      <div class="dlg-actions">
        <el-button @click="mergeVisible = false">取消</el-button>
        <el-button type="primary" :loading="merging" @click="doMerge">合并</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';

const route = useRoute();
const id = route.params.id as string;
const detail = ref<any>(null);
const activeTab = ref<'category' | 'shop' | 'symbol'>('category');

const entities = ref<any[]>([]);
const selection = ref<any[]>([]);
const loaded = ref(false);
const renameVisible = ref(false);
const renameName = ref('');
const renaming = ref(false);
const mergeVisible = ref(false);
const mergeTarget = ref('');
const merging = ref(false);

const mergeTargets = computed(() =>
  entities.value.filter((e) => !selection.value.some((s) => s.id === e.id)),
);

function avatarText(name: string) {
  return (name || '?').slice(0, 1).toUpperCase();
}
function fmt(t: number | null | undefined) {
  return t ? new Date(Number(t)).toLocaleString() : '—';
}

function onSelect(rows: any[]) {
  selection.value = rows;
}

async function loadEntities() {
  loaded.value = false;
  try {
    entities.value = await adminApi.maintenanceEntities({ bookId: id, type: activeTab.value });
  } finally {
    loaded.value = true;
  }
}

function openRename() {
  const s = selection.value[0];
  renameName.value = s?.name ?? '';
  renameVisible.value = true;
}

async function doRename() {
  if (!renameName.value.trim()) return ElMessage.warning('请输入新名称');
  renaming.value = true;
  try {
    await adminApi.maintenanceRename({
      bookId: id,
      type: activeTab.value,
      id: selection.value[0].id,
      name: renameName.value.trim(),
    });
    ElMessage.success('已重命名，等待客户端同步');
    renameVisible.value = false;
    await loadEntities();
  } finally {
    renaming.value = false;
  }
}

async function confirmDelete() {
  try {
    await ElMessageBox.confirm(
      `将删除选中的 ${selection.value.length} 项（相关账目引用保留，删除后不可恢复）。确认？`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    );
  } catch {
    return;
  }
  await adminApi.maintenanceDelete({
    bookId: id,
    type: activeTab.value,
    ids: selection.value.map((s) => s.id),
  });
  ElMessage.success('已删除，等待客户端同步');
  await loadEntities();
}

async function doMerge() {
  if (!mergeTarget.value) return ElMessage.warning('请选择目标项');
  merging.value = true;
  try {
    for (const s of selection.value) {
      await adminApi.maintenanceMerge({
        bookId: id,
        type: activeTab.value,
        fromId: s.id,
        toId: mergeTarget.value,
      });
    }
    ElMessage.success('已合并，账目引用已重定向');
    mergeVisible.value = false;
    mergeTarget.value = '';
    await loadEntities();
  } finally {
    merging.value = false;
  }
}

watch(activeTab, loadEntities);

onMounted(async () => {
  detail.value = await adminApi.bookDetail(id);
  await loadEntities();
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

.panel {
  padding: 20px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
}

.book-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.book-avatar {
  width: 52px;
  height: 52px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: var(--grad-purple);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}
.book-name {
  font-size: 20px;
  font-weight: 700;
}
.book-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-3);
}
.book-desc {
  margin-top: 14px;
  padding: 10px 12px;
  background: var(--surface-glass);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-2);
}
.members {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.members-label {
  font-size: 12px;
  color: var(--text-3);
}

.mt-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 4px 0 12px;
}
.mt-hint {
  font-size: 12px;
  color: var(--text-3);
}

.dlg-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.merge-tip {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--text-1);
}
.merge-note {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-3);
}
</style>
