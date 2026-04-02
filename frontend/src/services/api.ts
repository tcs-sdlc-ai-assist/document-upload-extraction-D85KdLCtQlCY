import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from '@/types/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
      }

      const apiError: ApiError = {
        statusCode: status,
        message:
          error.response.data?.message ||
          error.message ||
          'An unexpected error occurred',
        error: error.response.data?.error,
      };

      return Promise.reject(apiError);
    }

    if (error.request) {
      const apiError: ApiError = {
        statusCode: 0,
        message: 'Network error. Please check your connection and try again.',
      };
      return Promise.reject(apiError);
    }

    const apiError: ApiError = {
      statusCode: 0,
      message: error.message || 'An unexpected error occurred',
    };
    return Promise.reject(apiError);
  },
);

export default api;