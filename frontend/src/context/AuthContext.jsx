import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aav_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('aav_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/user')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('aav_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (loginId, password) => {
    const res = await api.post('/login', { login: loginId, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('aav_token', receivedToken);
    localStorage.setItem('aav_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('aav_token');
      localStorage.removeItem('aav_user');
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/user');
      setUser(res.data.user);
      localStorage.setItem('aav_user', JSON.stringify(res.data.user));
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  const isAdmin = user?.role === 'senior_admin';
  const isManager = user?.role === 'branch_manager';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      refreshUser,
      isAdmin,
      isManager,
      isEmployee,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
