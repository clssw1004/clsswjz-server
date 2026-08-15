import http from './http';

export const adminApi = {
  login: (username: string, password: string) =>
    http.post('/admin/login', { username, password }),
  overview: () => http.get('/admin/overview'),
  materialize: () => http.post('/admin/materialize'),
  materializeReset: () => http.post('/admin/materialize/reset'),
  materializeStatus: () => http.get('/admin/materialize/status'),
  users: (params: Record<string, unknown>) => http.get('/admin/users', { params }),
  userDetail: (id: string) => http.get(`/admin/users/${id}`),
  userLogs: (id: string, params: Record<string, unknown>) =>
    http.get(`/admin/users/${id}/logs`, { params }),
  userBooks: (id: string) => http.get(`/admin/users/${id}/books`),
  userItems: (id: string, params: Record<string, unknown>) =>
    http.get(`/admin/users/${id}/items`, { params }),
  logs: (params: Record<string, unknown>) => http.get('/admin/logs', { params }),
  logDetail: (id: string) => http.get(`/admin/logs/${id}`),
  statsOverview: (params?: Record<string, unknown>) =>
    http.get('/admin/stats/overview', { params }),
  statsTrend: (params: Record<string, unknown>) =>
    http.get('/admin/stats/trend', { params }),
  statsCategories: (type: string, params?: Record<string, unknown>) =>
    http.get('/admin/stats/categories', { params: { type, ...params } }),
  statsBooks: () => http.get('/admin/stats/books'),
  items: (params: Record<string, unknown>) =>
    http.get('/admin/items', { params }),
  itemDetail: (id: string) => http.get(`/admin/items/${id}`),
  books: (params: Record<string, unknown>) =>
    http.get('/admin/books', { params }),
  bookDetail: (id: string) => http.get(`/admin/books/${id}`),
  systemInfo: () => http.get('/admin/system/info'),
  maintenanceEntities: (params: Record<string, unknown>) =>
    http.get('/admin/maintenance/entities', { params }),
  maintenanceRename: (data: Record<string, unknown>) =>
    http.post('/admin/maintenance/rename', data),
  maintenanceDelete: (data: Record<string, unknown>) =>
    http.post('/admin/maintenance/delete', data),
  maintenanceMerge: (data: Record<string, unknown>) =>
    http.post('/admin/maintenance/merge', data),
};
