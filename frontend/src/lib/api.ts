import { API_BASE_URL } from '@/config/constants';
import type {
  AnalyzeMealRequest,
  AnalyzeMealResult,
  DashboardData,
  Meal,
  MealAdvice,
  MealAdviceRequest,
  MealInput,
  Profile,
  ProfileInput,
  TrendPoint,
} from '@shared/types/nutrition';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/api/nutrition${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    // Session expired or invalid: clear the token and go back to the login page.
    localStorage.removeItem('token');
    window.location.href = '/#/login';
    window.location.reload();
    throw new Error('登录已失效，请重新登录');
  }
  let body: { success?: boolean; data?: T; error?: string | { message?: string } } | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || !body || !body.success) {
    const err = body?.error;
    const message = typeof err === 'string' ? err : err?.message;
    throw new Error(message || '请求失败，请稍后重试');
  }
  return body.data as T;
}

export const api = {
  getDashboard: (date: string) => request<DashboardData>(`/dashboard?date=${date}`),
  getTrend: (end: string, days: 7 | 30) =>
    request<TrendPoint[]>(`/trend?end=${end}&days=${days}`),
  getMeals: (end: string, days = 1) => request<Meal[]>(`/meals?end=${end}&days=${days}`),
  analyzeMeal: (payload: AnalyzeMealRequest) =>
    request<AnalyzeMealResult>('/meals/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMealAdvice: (payload: MealAdviceRequest) =>
    request<MealAdvice>('/meals/advice', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createMeal: (payload: MealInput) =>
    request<Meal>('/meals', { method: 'POST', body: JSON.stringify(payload) }),
  deleteMeal: (id: string) => request<{ id: string }>(`/meals/${id}`, { method: 'DELETE' }),
  getProfile: () => request<Profile>('/profile'),
  updateProfile: (payload: ProfileInput) =>
    request<Profile>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
};
