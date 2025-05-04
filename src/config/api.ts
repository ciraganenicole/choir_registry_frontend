import axios, { type InternalAxiosRequestConfig } from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const { accessToken } = JSON.parse(user);
        if (accessToken) {
          config.headers.set('Authorization', `Bearer ${accessToken}`);
        }
      }
      return config;
    } catch (error) {
      // If there's any error parsing the user data, clear it
      localStorage.removeItem('user');
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data and redirect to login
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);
