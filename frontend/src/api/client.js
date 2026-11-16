import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://evil-lights-refuse.loca.lt/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Bypass-Tunnel-Reminder': '1',
  },
});

// Request interceptor to attach bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aav_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('aav_token');
      localStorage.removeItem('aav_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
