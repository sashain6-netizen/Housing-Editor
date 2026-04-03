// Debug authentication issues
console.log('=== Authentication Debug ===');

// Check current URL and path
console.log('Current URL:', window.location.href);
console.log('Current path:', window.location.pathname);

// Check for existing token in localStorage
const token = localStorage.getItem('auth_token');
console.log('Token in localStorage:', token ? 'exists' : 'none');

// Check axios default headers
if (window.axios) {
  console.log('Axios auth header:', window.axios.defaults.headers.common['Authorization']);
}

// Check if we're on login or register page
const isLoginPage = window.location.pathname.includes('/login');
const isRegisterPage = window.location.pathname.includes('/register');
console.log('On login page:', isLoginPage);
console.log('On register page:', isRegisterPage);

// Clear auth data if needed
function clearAuthData() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  if (window.axios) {
    delete window.axios.defaults.headers.common['Authorization'];
  }
  console.log('Auth data cleared');
}

// Export for manual use in console
window.debugAuth = {
  clearAuthData,
  token,
  isLoginPage,
  isRegisterPage
};

console.log('Run debugAuth.clearAuthData() in console to clear auth data');
