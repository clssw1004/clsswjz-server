import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => {
    // 后端统一包 { code, message, data }，解出 data
    const body = res.data;
    if (body && typeof body.code !== 'undefined') {
      return body.data;
    }
    return body;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      router.push('/login');
    }
    const msg = err.response?.data?.message || err.message || '请求失败';
    ElMessage.error(msg);
    return Promise.reject(err);
  },
);

export default http;
