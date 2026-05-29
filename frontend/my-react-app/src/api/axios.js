import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const instance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

// Request Interceptor to attach JWT token
instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
