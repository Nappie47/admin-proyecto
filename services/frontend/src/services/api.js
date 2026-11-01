import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Interceptor to add JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cementerio_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
};

export const sepulturaService = {
  list: (params) => api.get('/sepulturas', { params }),
  stats: () => api.get('/sepulturas/stats'),
  get: (id) => api.get(`/sepulturas/${id}`),
  geojson: (params) => api.get('/sepulturas/geojson', { params }),
  create: (data) => api.post('/sepulturas', data),
  update: (id, data) => api.put(`/sepulturas/${id}`, data),
  delete: (id) => api.delete(`/sepulturas/${id}`),
};

export const patioService = {
  list: () => api.get('/patios'),
  get: (id) => api.get(`/patios/${id}`),
  geojson: () => api.get('/patios/geojson'),
  create: (data) => api.post('/patios', data),
  update: (id, data) => api.put(`/patios/${id}`, data),
  delete: (id) => api.delete(`/patios/${id}`),
};

export const mausoleoService = {
  list: (params) => api.get('/mausoleos', { params }),
  get: (id) => api.get(`/mausoleos/${id}`),
  create: (data) => api.post('/mausoleos', data),
};

export const userService = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
