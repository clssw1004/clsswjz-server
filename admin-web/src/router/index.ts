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
          path: 'books',
          component: () => import('../views/Books.vue'),
          meta: { title: '账本管理' },
        },
        {
          path: 'books/:id',
          component: () => import('../views/BookDetail.vue'),
          meta: { title: '账本详情' },
        },
        {
          path: 'system',
          component: () => import('../views/System.vue'),
          meta: { title: '系统信息' },
        },
        {
          path: 'logs',
          component: () => import('../views/Logs.vue'),
          meta: { title: '日志审计' },
        },
        {
          path: 'items',
          component: () => import('../views/Items.vue'),
          meta: { title: '账目管理' },
        },
        {
          path: 'notes',
          component: () => import('../views/Notes.vue'),
          meta: { title: '记事管理' },
        },
        {
          path: 'items/:id',
          component: () => import('../views/ItemDetail.vue'),
          meta: { title: '账目详情' },
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
