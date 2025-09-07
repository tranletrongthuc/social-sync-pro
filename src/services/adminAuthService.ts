// Admin Authentication Service

/**
 * Check if admin is currently authenticated
 * @returns boolean indicating if admin is authenticated
 */
export const isAdminAuthenticated = (): boolean => {
  const authToken = localStorage.getItem('adminAuthToken');
  const authExpiry = localStorage.getItem('adminAuthExpiry');
  
  if (authToken && authExpiry) {
    const expiryTime = parseInt(authExpiry, 10);
    const currentTime = new Date().getTime();
    
    // If token is still valid (not expired), return true
    if (currentTime < expiryTime) {
      return true;
    } else {
      // Token expired, clear storage
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminAuthExpiry');
      return false;
    }
  }
  
  return false;
};

/**
 * Authenticate admin user
 * @param password The password to check
 * @returns boolean indicating if authentication was successful
 */
export const authenticateAdmin = (password: string): boolean => {
  const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
  
  if (password === adminPass) {
    // Set authentication token with 3-day expiration (259200000 milliseconds)
    const expiryTime = new Date().getTime() + (3 * 24 * 60 * 60 * 1000);
    localStorage.setItem('adminAuthToken', 'authenticated');
    localStorage.setItem('adminAuthExpiry', expiryTime.toString());
    return true;
  }
  
  return false;
};

/**
 * Logout admin user
 */
export const logoutAdmin = (): void => {
  localStorage.removeItem('adminAuthToken');
  localStorage.removeItem('adminAuthExpiry');
};

/**
 * Get remaining time until expiration in milliseconds
 * @returns number of milliseconds until expiration, or 0 if not authenticated or expired
 */
export const getAuthTimeRemaining = (): number => {
  const authExpiry = localStorage.getItem('adminAuthExpiry');
  
  if (authExpiry) {
    const expiryTime = parseInt(authExpiry, 10);
    const currentTime = new Date().getTime();
    const timeRemaining = expiryTime - currentTime;
    
    return timeRemaining > 0 ? timeRemaining : 0;
  }
  
  return 0;
};