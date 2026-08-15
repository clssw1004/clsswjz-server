<template>
  <div class="login-page">
    <!-- 背景辉光 -->
    <div class="app-bg" aria-hidden="true" />
    <div class="orb orb-1" aria-hidden="true" />
    <div class="orb orb-2" aria-hidden="true" />

    <div class="login-card glass fade-in">
      <div class="login-brand">
        <span class="login-mark">记</span>
        <h1 class="login-title">记账管理台</h1>
        <p class="login-sub">CLSSWJZ · 运维控制台</p>
      </div>

      <!-- autocomplete 不用 username/current-password：
           会被浏览器密码管理器接管，失焦时重置已输入的账号字段 -->
      <el-form class="login-form" autocomplete="off" @submit.prevent="doLogin">
        <el-form-item>
          <el-input
            v-model="username"
            size="large"
            placeholder="管理员账号"
            :prefix-icon="User"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            size="large"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
            @keyup.enter="doLogin"
          />
        </el-form-item>
        <el-button
          class="login-btn"
          size="large"
          :loading="loading"
          @click="doLogin"
        >
          <span>{{ loading ? '登录中…' : '登 录' }}</span>
        </el-button>
        <p class="login-hint">仅限授权运维人员访问</p>
      </el-form>
    </div>

    <p class="login-foot">CLSSWJZ Sync Console · v0.1</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { adminApi } from '../api/admin';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);

async function doLogin() {
  if (!username.value || !password.value) {
    return ElMessage.warning('请输入账号和密码');
  }
  loading.value = true;
  try {
    const data = await adminApi.login(username.value, password.value);
    localStorage.setItem('admin_token', data.access_token);
    ElMessage.success('欢迎回来');
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px;
}

@media (prefers-reduced-motion: reduce) {
  .orb {
    animation: none;
  }
}

/* 漂浮光斑 */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  pointer-events: none;
  animation: drift 16s ease-in-out infinite alternate;
}
.orb-1 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.55), transparent 70%);
  top: -90px;
  left: -70px;
}
.orb-2 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.5), transparent 70%);
  bottom: -110px;
  right: -80px;
  animation-duration: 20s;
  animation-direction: alternate-reverse;
}
@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(46px, 34px) scale(1.12); }
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 36px 28px;
  border-radius: 20px;
  --d: 60ms;
}
.login-brand {
  text-align: center;
  margin-bottom: 28px;
}
.login-mark {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--grad-gold);
  color: #1c1204;
  font-size: 28px;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.45);
}
.login-title {
  margin: 16px 0 4px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.login-sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-3);
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
}

.login-form :deep(.el-input__wrapper) {
  padding: 4px 14px;
}
.login-form :deep(.el-input__prefix) {
  color: var(--text-3);
}
.login-form :deep(.el-input.is-focus .el-input__prefix) {
  color: var(--brand-gold);
}

.login-btn {
  width: 100%;
  margin-top: 4px;
  height: 46px;
  font-size: 15px;
  letter-spacing: 0.2em;
  font-weight: 600;
}
.login-hint {
  margin: 16px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
}

.login-foot {
  position: absolute;
  bottom: 18px;
  font-size: 12px;
  color: var(--text-3);
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
}
</style>
