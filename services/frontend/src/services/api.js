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

// Interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cementerio_token');
      localStorage.removeItem('cementerio_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  facialLogin: (image) => api.post('/auth/facial-login', { image }),
  me: () => api.get('/auth/me'),
};

export const biometricsService = {
  register: (userId, image) => api.post(`/users/${userId}/biometrics`, { image }),
  delete: (userId) => api.delete(`/users/${userId}/biometrics`),
  getStatus: () => api.get('/users/biometrics-status'),
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
