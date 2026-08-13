<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>记账管理台</h2>
      <el-form @submit.prevent="doLogin">
        <el-form-item>
          <el-input v-model="username" placeholder="管理员账号" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            show-password
            @keyup.enter="doLogin"
          />
        </el-form-item>
        <el-button
          type="primary"
          :loading="loading"
          style="width: 100%"
          @click="doLogin"
        >
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api/admin';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);

async function doLogin() {
  if (!username.value || !password.value) {
    return ElMessage.warning('请输入账号密码');
  }
  loading.value = true;
  try {
    const data = await adminApi.login(username.value, password.value);
    localStorage.setItem('admin_token', data.access_token);
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.login-card {
  width: 360px;
  padding: 8px 16px;
}
h2 {
  text-align: center;
  margin-bottom: 16px;
}
</style>
