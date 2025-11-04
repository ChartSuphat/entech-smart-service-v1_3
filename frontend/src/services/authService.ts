import api from '../utils/axios';

// 🔐 Login
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

// 🆕 Register
export const register = (data: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}) => api.post('/auth/register', data);

// ✅ Verify Email
export const verifyEmail = (token: string) =>
  api.get(`/auth/verify?token=${token}`);

// 🚪 Logout
export const logout = () => api.post('/auth/logout');
