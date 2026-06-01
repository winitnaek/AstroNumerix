import axios from 'axios';
import { getToken } from '../utils/storage';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function unwrap(promise) {
  return promise.then((response) => response.data).catch((error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    throw new Error(message);
  });
}

export const api = {
  register: (payload) => unwrap(client.post('/auth/register', payload)),
  login: (payload) => unwrap(client.post('/auth/login', payload)),
  forgotPassword: (payload) => unwrap(client.post('/auth/forgot-password', payload)),
  resetPassword: (payload) => unwrap(client.post('/auth/reset-password', payload)),
  me: () => unwrap(client.get('/auth/me')),
  fetchCurrentUser: () => unwrap(client.get('/auth/me')),
  updateCurrentUser: (payload) => unwrap(client.patch('/users/me', payload)),
  createProfile: (payload) => unwrap(client.post('/numerology/profile', payload)),
  forecast: (payload) => unwrap(client.post('/numerology/forecast', payload)),
  compatibility: (payload) => unwrap(client.post('/numerology/compatibility', payload)),
  loshu: (payload) => unwrap(client.post('/numerology/loshu', payload)),
  nameScore: (payload) => unwrap(client.post('/numerology/name-score', payload)),
  fetchCalculationHistory: () => unwrap(client.get('/numerology/history')),
  clearCalculationHistory: () => unwrap(client.delete('/numerology/history')),
  cleanTradeAnalysis: (payload) => unwrap(client.post('/trade/clean-analysis', payload))
};
