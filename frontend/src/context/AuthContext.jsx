import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import realtime from '../services/websocket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            realtime.connect();
          }
        } catch (e) {
          // Token invalid or expired
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const res = await api.post('/auth/login', { email: cleanEmail, password });
    if (res.success) {
      const { accessToken, refreshToken, user: u } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      realtime.connect();
      return u;
    }
  };

  const register = async (fullName, email, phone, password) => {
    const res = await api.post('/auth/register', { 
      fullName: fullName ? fullName.trim() : '', 
      email: email ? email.trim().toLowerCase() : '', 
      phone: phone ? phone.trim() : '', 
      password 
    });
    if (res.success) {
      const { accessToken, refreshToken, user: u } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      realtime.connect();
      return u;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      // Ignore network errors on logout cleanup
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      realtime.disconnect();
    }
  };

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
