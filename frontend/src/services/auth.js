export async function register(userData) {
    try {
      const response = await fetch('../server/api/auth/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
  
  export async function login(credentials) {
    try {
      const response = await fetch('../server/api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
  
  export async function logout() {
    try {
      const response = await fetch('../server/api/auth/logout.php', {
        method: 'POST',
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }