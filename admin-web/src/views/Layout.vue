<template>
  <div class="app-layout">
    <div class="app-bg" aria-hidden="true" />

    <!-- 桌面端侧边栏 -->
    <aside class="app-side">
      <div class="app-brand">
        <span class="app-brand-mark">记</span>
        <span class="app-brand-name">记账管理台</span>
        <span class="app-brand-sub">CLSSWJZ Console</span>
      </div>
      <nav class="side-nav">
        <div class="side-nav-label">工作台</div>
        <router-link v-for="item in navs" :key="item.path" :to="item.path" class="side-nav-item" :class="{ active: $route.path.startsWith(item.path) }">
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="app-side-foot">
        <span class="pulse-dot" aria-hidden="true" />
        管理端 · 只读运维
      </div>
    </aside>

    <!-- 移动端抽屉导航 -->
    <el-drawer v-model="drawerOpen" direction="ltr" size="268px" :with-header="false" class="app-drawer">
      <div class="app-brand">
        <span class="app-brand-mark">记</span>
        <span class="app-brand-name">记账管理台</span>
        <span class="app-brand-sub">CLSSWJZ Console</span>
      </div>
      <nav class="side-nav">
        <div class="side-nav-label">工作台</div>
        <router-link v-for="item in navs" :key="item.path" :to="item.path" class="side-nav-item" :class="{ active: $route.path.startsWith(item.path) }" @click="drawerOpen = false">
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </el-drawer>

    <!-- 主区 -->
    <div class="app-main">
      <header class="app-topbar">
        <button class="menu-btn" type="button" aria-label="打开导航菜单" @click="drawerOpen = true">
          <el-icon :size="20"><Menu /></el-icon>
        </button>
        <div class="topbar-title">
          <span class="topbar-current">{{ $route.meta.title }}</span>
          <span class="topbar-crumb" v-if="isDesktop">{{ crumb }}</span>
        </div>
        <div class="topbar-actions">
          <el-tag effect="dark" round class="admin-tag">
            <span class="pulse-dot" aria-hidden="true" />
            ADMIN
          </el-tag>

          <!-- 主题颜色切换（与 App 端 Colors.primaries 一致） -->
          <el-popover placement="bottom-end" :width="276" trigger="click" popper-class="theme-pop">
            <template #reference>
              <button class="theme-btn" type="button" aria-label="切换主题颜色" title="主题颜色">
                <span class="theme-btn-dot" :style="{ background: activeTheme.primary }" aria-hidden="true" />
                <el-icon :size="16"><Brush /></el-icon>
              </button>
            </template>
            <div class="theme-picker">
              <div class="theme-picker-title">主题颜色</div>
              <div class="theme-swatches">
                <button
                  v-for="t in THEMES"
                  :key="t.id"
                  type="button"
                  class="theme-swatch"
                  :class="{ active: t.id === activeThemeId }"
                  :style="{ background: t.primary, color: t.onPrimary }"
                  :title="t.name"
                  @click="setTheme(t.id)"
                >
                  <el-icon v-if="t.id === activeThemeId" :size="14"><Check /></el-icon>
                </button>
              </div>
            </div>
          </el-popover>

          <el-button text class="logout-btn" @click="logout">
            <el-icon :size="16"><SwitchButton /></el-icon>
            <span class="logout-text">退出登录</span>
          </el-button>
        </div>
      </header>

      <main class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Menu,
  SwitchButton,
  Odometer,
  User,
  Document,
  TrendCharts,
  List,
  Notebook,
  Setting,
  Memo,
  Brush,
  Check,
} from '@element-plus/icons-vue';
import { THEMES, activeTheme, activeThemeId, setTheme } from '../styles/themes';

const router = useRouter();
const route = useRoute();
const drawerOpen = ref(false);
const isDesktop = ref(window.innerWidth >= 1024);

function onResize() {
  isDesktop.value = window.innerWidth >= 1024;
  if (isDesktop.value) drawerOpen.value = false;
}
onMounted(() => window.addEventListener('resize', onResize));
onBeforeUnmount(() => window.removeEventListener('resize', onResize));

const navs = [
  { path: '/dashboard', label: '概览', icon: Odometer },
  { path: '/users', label: '用户管理', icon: User },
  { path: '/books', label: '账本管理', icon: Notebook },
  { path: '/items', label: '账目管理', icon: List },
  { path: '/notes', label: '记事管理', icon: Memo },
  { path: '/logs', label: '日志审计', icon: Document },
  { path: '/stats', label: '业务报表', icon: TrendCharts },
  { path: '/system', label: '系统信息', icon: Setting },
];

const crumb = computed(() => {
  if (route.path.startsWith('/users/')) return '用户管理 / 详情';
  return '管理台';
});

function logout() {
  localStorage.removeItem('admin_token');
  router.push('/login');
}
</script>

<style>
/* 布局为应用外壳，使用全局样式（非 scoped）以便抽屉 teleport 后依然生效 */

.app-layout {
  min-height: 100vh;
  display: flex;
}

/* ---------- 品牌 ---------- */
.app-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 16px 22px;
  gap: 2px;
}
.app-brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--grad-gold);
  color: var(--on-primary);
  font-size: 24px;
  font-weight: 700;
  display: grid;
  place-items: center;
  box-shadow: var(--glow-primary);
  margin-bottom: 10px;
}
.app-brand-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.app-brand-sub {
  font-size: 11px;
  color: var(--text-3);
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  margin-top: 2px;
}

/* ---------- 侧边栏 ---------- */
.app-side {
  width: 248px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(20, 28, 50, 0.72), rgba(10, 16, 30, 0.72));
  border-right: 1px solid var(--border-glass);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
}
.app-side-foot {
  margin-top: auto;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-3);
  border-top: 1px solid var(--border-glass);
}

/* 呼吸状态点 */
.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
  animation: pulse 2.2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  70% { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* ---------- 导航 ---------- */
.side-nav {
  padding: 8px 14px;
  flex: 1;
  overflow-y: auto;
}
.side-nav-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-3);
  padding: 10px 12px 6px;
}
.side-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 46px;
  padding: 0 14px;
  margin: 3px 0;
  border-radius: 12px;
  color: var(--text-2);
  font-size: 14px;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
}
.side-nav-item .el-icon {
  color: var(--text-3);
  transition: color 0.2s ease;
}
.side-nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-1);
}
.side-nav-item:hover .el-icon {
  color: var(--brand-gold-strong);
}
.side-nav-item.active {
  background: var(--grad-gold);
  color: var(--on-primary);
  font-weight: 600;
  box-shadow: var(--glow-primary);
}
.side-nav-item.active .el-icon {
  color: var(--on-primary);
}

/* ---------- 顶栏 ---------- */
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.app-topbar {
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 24px;
  background: rgba(9, 14, 26, 0.6);
  border-bottom: 1px solid var(--border-glass);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
}
.menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  background: var(--surface-glass);
  color: var(--text-1);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}
.menu-btn:hover {
  background: var(--surface-hover);
}
.topbar-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.topbar-current {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.topbar-crumb {
  font-size: 12px;
  color: var(--text-3);
  white-space: nowrap;
}
.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(16, 185, 129, 0.14);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
}
.logout-btn {
  color: var(--text-2);
}
.logout-btn:hover {
  color: var(--brand-red-light);
  background: rgba(239, 68, 68, 0.08);
}

/* 主题切换按钮 */
.theme-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  background: var(--surface-glass);
  color: var(--text-2);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.theme-btn:hover {
  background: var(--surface-hover);
  color: var(--text-1);
  border-color: var(--border-glass-strong);
}
.theme-btn-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

/* 主题色板弹层（teleport 到 body，需全局可见，故用非 scoped 前缀） */
.theme-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.theme-picker-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
}
.theme-swatches {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.theme-swatch {
  aspect-ratio: 1;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.theme-swatch:hover {
  transform: scale(1.12);
}
.theme-swatch.active {
  box-shadow:
    0 0 0 2px var(--bg-page),
    0 0 0 4px var(--text-1);
  transform: scale(1.05);
}
/* 让 teleport 出去的色板在暗色下可用 */
.theme-pop.el-popover {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--border-glass);
  backdrop-filter: var(--blur-glass);
  --el-popover-padding: 14px;
}

/* ---------- 内容区 ---------- */
.app-content {
  flex: 1;
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
  padding: 24px;
}

/* 路由切换动效 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}

/* ---------- 移动端 ---------- */
@media (max-width: 1023px) {
  .app-side {
    display: none;
  }
  .menu-btn {
    display: inline-flex;
  }
  .app-content {
    padding: 16px;
  }
  .topbar-crumb {
    display: none;
  }
}
@media (max-width: 480px) {
  .app-topbar {
    padding: 0 12px;
  }
  .logout-text {
    display: none;
  }
  .admin-tag {
    display: none;
  }
}

/* 移动端抽屉 */
.app-drawer .el-drawer__body {
  padding: 0;
  display: flex;
  flex-direction: column;
}
.app-drawer .app-brand {
  padding-top: 28px;
}
.app-drawer .side-nav {
  flex: 1;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
  .pulse-dot {
    animation: none;
  }
}
</style>
