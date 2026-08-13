import http from './http';

export const adminApi = {
  login: (username: string, password: string) =>
    http.post('/admin/login', { username, password }),
  overview: () => http.get('/admin/overview'),
  materialize: () => http.post('/admin/materialize'),
  materializeReset: () => http.post('/admin/materialize/reset'),
  users: (params: Record<string, unknown>) => http.get('/admin/users', { params }),
  userDetail: (id: string) => http.get(`/admin/users/${id}`),
  userLogs: (id: string, params: Record<string, unknown>) =>
    http.get(`/admin/users/${id}/logs`, { params }),
  userBooks: (id: string) => http.get(`/admin/users/${id}/books`),
  userItems: (id: string, params: Record<string, unknown>) =>
    http.get(`/admin/users/${id}/items`, { params }),
  logs: (params: Record<string, unknown>) => http.get('/admin/logs', { params }),
  logDetail: (id: string) => http.get(`/admin/logs/${id}`),
  statsOverview: () => http.get('/admin/stats/overview'),
  statsTrend: (params: Record<string, unknown>) =>
    http.get('/admin/stats/trend', { params }),
  statsCategories: (type: string) =>
    http.get('/admin/stats/categories', { params: { type } }),
};
