import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when the component mounts
  useEffect(() => {
    // Check if we have a user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Register function 
  async function register(userData) {
    const response = await fetch('../server/api/auth/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    return await response.json();
  }
  
  // Login function - update to store user in state and localStorage
  async function login(credentials) {
    const response = await fetch('../server/api/auth/login.php', {
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
  }
  
  // Logout function - update to clear state and localStorage
  async function logout() {
    const response = await fetch('../server/api/auth/logout.php', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      setUser(null);
      localStorage.removeItem('user');
    }
    
    return data;
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