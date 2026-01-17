// src/lib/api-client.js

/**
 * API Client untuk fetch data dengan auto token handling
 */
export async function apiFetch(url, options = {}) {
  try {
    // Ambil token dari localStorage
    const token = localStorage.getItem('token');
    
    // Setup headers
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    
    // Tambahkan Authorization header jika ada token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Merge options
    const fetchOptions = {
      ...options,
      headers,
    };
    
    // Fetch data
    const response = await fetch(url, fetchOptions);
    
    // Handle 401 Unauthorized (token expired/invalid)
    if (response.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }
    
    // Parse response
    const data = await response.json();
    
    // Handle error responses
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

/**
 * Helper untuk GET request
 */
export async function apiGet(url) {
  return apiFetch(url, { method: 'GET' });
}

/**
 * Helper untuk POST request
 */
export async function apiPost(url, body) {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Helper untuk PUT request
 */
export async function apiPut(url, body) {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Helper untuk PATCH request
 */
export async function apiPatch(url, body) {
  return apiFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Helper untuk DELETE request
 */
export async function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' });
}