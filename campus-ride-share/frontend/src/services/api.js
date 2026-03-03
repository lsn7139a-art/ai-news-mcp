import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// 拼车相关API
export const ridesAPI = {
  createRide: (rideData) => api.post('/rides', rideData),
  getRides: (params) => api.get('/rides', { params }),
  getMyRides: (params) => api.get('/rides/my', { params }),
  joinRide: (rideId) => api.post(`/rides/${rideId}/join`),
  cancelRide: (rideId) => api.delete(`/rides/${rideId}`),
  getStations: () => api.get('/rides/stations'),
};

// 匹配相关API
export const matchesAPI = {
  findMatches: (matchData) => api.post('/matches/find', matchData),
  getMatchHistory: (params) => api.get('/matches/history', { params }),
  updateMatchStatus: (matchId, status) => api.put(`/matches/${matchId}/status`, { status }),
  getMatchStats: () => api.get('/matches/stats'),
  batchMatching: () => api.post('/matches/batch'),
};

// 用户相关API
export const usersAPI = {
  updateProfile: (userData) => api.put('/users/profile', userData),
  getUser: (userId) => api.get(`/users/${userId}`),
  getUsers: (params) => api.get('/users', { params }),
  changePassword: (passwordData) => api.put('/users/password', passwordData),
  deleteAccount: () => api.delete('/users/account'),
};

export default api;