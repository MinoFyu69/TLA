// src/hooks/useAuth.js

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();

  const refreshToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Failed to refresh token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Decode token untuk cek expiration (tanpa verify ke backend)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert ke milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        console.log('Token will expire in:', Math.floor(timeUntilExpiry / 1000 / 60), 'minutes');

        // Jika token kurang dari 1 jam lagi expired, refresh
        if (timeUntilExpiry < 60 * 60 * 1000) {
          console.log('Token expiring soon, refreshing...');
          await refreshToken();
        }

        // Set timer untuk auto-refresh sebelum expired
        const refreshTime = timeUntilExpiry - (60 * 60 * 1000); // Refresh 1 jam sebelum expired
        if (refreshTime > 0) {
          const timeoutId = setTimeout(async () => {
            console.log('Auto-refreshing token...');
            await refreshToken();
          }, refreshTime);

          // Cleanup timeout saat unmount
          return () => clearTimeout(timeoutId);
        }

      } catch (error) {
        console.error('Error checking token:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, refreshToken]);

  return { refreshToken };
}

// Helper untuk get user data
export function useUser() {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}