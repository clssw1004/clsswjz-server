<template>
  <div class="system">
    <!-- 运行环境 -->
    <div class="stat-grid">
      <div v-for="(c, i) in envCards" :key="c.label" class="stat-card glass glass-hover fade-in" :style="{ '--d': `${i * 55}ms` }">
        <div class="stat-icon" :class="c.grad"><el-icon :size="20"><component :is="c.icon" /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-value num">{{ c.value }}</div>
        </div>
      </div>
    </div>

    <!-- 数据库 -->
    <section class="glass panel fade-in" style="--d: 160ms">
      <header class="panel-head"><div class="panel-title">数据库</div></header>
      <div class="kv-grid">
        <div class="kv"><span class="kv-label">类型</span><span class="kv-value">{{ db.type }}</span></div>
        <div class="kv"><span class="kv-label">地址</span><span class="kv-value num">{{ db.host || '—' }}</span></div>
        <div class="kv"><span class="kv-label">库名</span><span class="kv-value num">{{ db.database || '—' }}</span></div>
      </div>
    </section>

    <!-- 回放状态 -->
    <section class="glass panel fade-in" style="--d: 220ms">
      <header class="panel-head">
        <div class="panel-title">日志回放</div>
        <el-tag :type="replay.failed > 0 ? 'danger' : 'success'" effect="plain" size="small">
          {{ replay.failed > 0 ? `${replay.failed} 条失败` : '正常' }}
        </el-tag>
      </header>
      <div class="replay-metrics">
        <div class="rp"><span class="rp-label">已回放</span><span class="rp-value num ok">{{ replay.materialized }}</span></div>
        <div class="rp"><span class="rp-label">待回放</span><span class="rp-value num">{{ replay.pending }}</span></div>
        <div class="rp"><span class="rp-label">失败</span><span class="rp-value num err">{{ replay.failed }}</span></div>
        <div class="rp"><span class="rp-label">总数</span><span class="rp-value num">{{ replay.total }}</span></div>
      </div>
      <el-progress :percentage="replayPercent" :stroke-width="10" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Monitor, Clock, Cpu, Files } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';

const info = ref<any>(null);

const db = computed(() => info.value?.database ?? {});
const replay = computed(() => info.value?.replay ?? { total: 0, materialized: 0, pending: 0, failed: 0 });
const replayPercent = computed(() => {
  if (!replay.value.total) return 0;
  return Math.round((replay.value.materialized / replay.value.total) * 100);
});

const envCards = computed(() => [
  { label: '版本', value: info.value?.version ?? '—', icon: Files, grad: 'grad-purple' },
  { label: 'Node', value: info.value?.node ?? '—', icon: Cpu, grad: 'grad-cyan' },
  { label: '运行时长', value: info.value ? `${fmtDuration(info.value.uptimeSec)}` : '—', icon: Clock, grad: 'grad-gold' },
  { label: '环境', value: info.value?.env ?? '—', icon: Monitor, grad: 'grad-green' },
]);

function fmtDuration(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d ? `${d}天${h}时` : h ? `${h}时${m}分` : `${m}分`;
}

onMounted(async () => {
  info.value = await adminApi.systemInfo();
});
</script>

<style scoped>
.system {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  min-width: 0;
}
.stat-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
}
.stat-icon.grad-gold { background: var(--grad-gold); color: var(--on-primary); }
.stat-icon.grad-purple { background: var(--grad-purple); }
.stat-icon.grad-green { background: var(--grad-green); }
.stat-icon.grad-cyan { background: var(--grad-cyan); }
.stat-body { flex: 1; min-width: 0; }
.stat-label { font-size: 12px; color: var(--text-2); }
.stat-value { margin-top: 3px; font-size: 20px; font-weight: 700; }

.panel { padding: 20px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.panel-title { font-size: 15px; font-weight: 600; }

.kv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.kv {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
}
.kv-label { font-size: 11px; color: var(--text-3); }
.kv-value { font-size: 13px; color: var(--text-1); }

.replay-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}
.rp {
  padding: 10px 12px;
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rp-label { font-size: 11px; color: var(--text-3); }
.rp-value { font-size: 18px; font-weight: 700; }
.rp-value.ok { color: var(--color-success); }
.rp-value.err { color: var(--color-danger); }

@media (max-width: 900px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .replay-metrics { grid-template-columns: repeat(2, 1fr); }
}
</style>
