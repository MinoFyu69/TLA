// src/lib/client-auth.js

/**
 * Get current user from localStorage
 */
export function getUser() {
  try {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get token from localStorage
 */
export function getToken() {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
}

/**
 * Save auth data to localStorage
 */
export function setAuth(user, token) {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  } catch (error) {
    console.error('Set auth error:', error);
  }
}

/**
 * Clear auth data from localStorage
 */
export function clearAuth() {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Clear auth error:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const user = getUser();
  const token = getToken();
  return !!(user && token);
}

/**
 * Check if user has specific role
 */
export function hasRole(role) {
  const user = getUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth() {
  if (typeof window === 'undefined') return;
  
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  
  return true;
}

/**
 * Redirect to specific page if user doesn't have required role
 */
export function requireRole(role, redirectTo = '/login') {
  if (typeof window === 'undefined') return;
  
  if (!hasRole(role)) {
    window.location.href = redirectTo;
    return false;
  }
  
  return true;
}