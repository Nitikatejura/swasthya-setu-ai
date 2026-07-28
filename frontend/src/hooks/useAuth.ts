'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone_number?: string;
  role: 'Admin' | 'Doctor' | 'Healthcare Worker';
  hospital_id?: string;
  requires_password_change: bool;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const login = async (username_or_email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { username_or_email, password });
    const { access_token, refresh_token, user } = res.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    document.cookie = `access_token=${access_token}; path=/; max-age=86400; SameSite=Lax`;
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    document.cookie = 'access_token=; path=/; max-age=0';
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, login, logout, setUser };
}
