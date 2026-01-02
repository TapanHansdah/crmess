'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Generate a unique session ID for this browser tab
    const generateSessionId = () => {
      const existingSessionId = sessionStorage.getItem('sessionId');
      if (existingSessionId) {
        return existingSessionId;
      }
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', newSessionId);
      return newSessionId;
    };

    setSessionId(generateSessionId());
    
    // Check if user is logged in on mount
    checkAuth();

    // Listen for storage changes to handle multiple tabs
    const handleStorageChange = (e) => {
      if (e.key === 'authLogout') {
        setUser(null);
      } else if (e.key === 'authUpdate') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId || 'unknown',
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Broadcast to other tabs
        localStorage.setItem('authUpdate', JSON.stringify({ timestamp: Date.now(), user: userData }));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, firstName, lastName, company) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          company,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Signup API error:', error);
        throw new Error(error.error || error.message || 'Signup failed');
      }

      const data = await response.json();
      setUser(data.user);
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      // Broadcast login to other tabs
      localStorage.setItem('authUpdate', JSON.stringify({ timestamp: Date.now(), user: data.user }));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      // Broadcast logout to other tabs
      localStorage.setItem('authLogout', JSON.stringify({ timestamp: Date.now(), sessionId }));
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
