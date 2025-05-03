import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add API_URL constant to match gameservice.js
  const API_URL = 'http://localhost:8000/';

  // Check if user is already logged in when the component mounts
  useEffect(() => {
    // Check if we have a user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Register function - with updated URL
  async function register(userData) {
    try {
      const response = await fetch(`${API_URL}api/auth/register.php`, {
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
  
  // Login function - with updated URL and error handling
  async function login(credentials) {
    try {
      const response = await fetch(`${API_URL}api/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
  
  // Logout function - with updated URL and error handling
  async function logout() {
    try {
      const response = await fetch(`${API_URL}api/auth/logout.php`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(null);
        localStorage.removeItem('user');
      }
      
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      localStorage.removeItem('user');
      return { success: true, error: 'Logged out locally, but server error occurred' };
    }
  }

  // The value that will be given to the context
  const value = {
    user,
    register,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}