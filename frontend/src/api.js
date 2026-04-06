import axios from 'axios';

// In production (Render), REACT_APP_API_URL is set to the backend service URL
// In local dev, proxy in package.json forwards /api → localhost:5000
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
