import api from '@/services/api';
import {
  AuthResponse,
  Session,
  LogoutResponse,
  LoginCredentials,
  User,
} from '@/types/types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const credentials: LoginCredentials = { email, password };
  const response = await api.post<AuthResponse>('/auth/login', credentials);

  const { user, token } = response.data;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return response.data;
}

export async function logout(): Promise<LogoutResponse> {
  try {
    const response = await api.post<LogoutResponse>('/auth/logout');
    return response.data;
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export async function getSession(): Promise<Session> {
  const response = await api.get<Session>('/auth/session');
  return response.data;
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  return !!token;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}