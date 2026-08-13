import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Layout from '../views/Layout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: { title: '概览' },
        },
        {
          path: 'users',
          component: () => import('../views/Users.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'users/:id',
          component: () => import('../views/UserDetail.vue'),
          meta: { title: '用户详情' },
        },
        {
          path: 'logs',
          component: () => import('../views/Logs.vue'),
          meta: { title: '日志审计' },
        },
        {
          path: 'stats',
          component: () => import('../views/Stats.vue'),
          meta: { title: '业务报表' },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  if (to.path !== '/login' && !localStorage.getItem('admin_token')) {
    return '/login';
  }
  return true;
});

export default router;
