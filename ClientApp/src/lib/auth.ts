// Utilidades para peticiones autenticadas

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Agregar token si está disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // Mantener cookies por si funcionan
  };
  
  return fetch(url, fetchOptions);
}

export function getStoredUserData() {
  const userData = localStorage.getItem('user');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (userData && isAuthenticated) {
    return JSON.parse(userData);
  }
  
  return null;
}

export function clearAuthData() {
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('authToken');
}