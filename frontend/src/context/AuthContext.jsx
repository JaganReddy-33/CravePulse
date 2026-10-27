import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import realtime from '../services/websocket';

const AuthContext = createContext(null);

const EMAIL_ALIASES = {
  'jaganmohan.reddy@cravepulse.in': 'customer@foodora.com',
  'chef.lohith@cravepulse.in': 'chef@foodanalytics.com',
  'captain.prasad@cravepulse.in': 'rider@swiftlogistics.com',
  'admin.jagan@cravepulse.in': 'admin@foodplatform.com',
  'partner@foodplatform.com': 'chef@foodanalytics.com',
  'rider@foodplatform.com': 'rider@swiftlogistics.com',
};

const DEMO_USERS = {
  CUSTOMER: { email: 'customer@foodora.com', password: 'Password@123' },
  RESTAURANT_OWNER: { email: 'chef@foodanalytics.com', password: 'Password@123' },
  RIDER: { email: 'rider@swiftlogistics.com', password: 'Password@123' },
  ADMIN: { email: 'admin@foodplatform.com', password: 'Password@123' },
};

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
          // Token invalid
          localStorage.removeItem('accessToken');
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
    const resolvedEmail = EMAIL_ALIASES[cleanEmail] || email;
    const res = await api.post('/auth/login', { email: resolvedEmail, password });
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

  const register = async (fullName, email, phone, password, role) => {
    const res = await api.post('/auth/register', { fullName, email, phone, password, role });
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

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    realtime.disconnect();
  };

  // Quick switch for portfolio reviewers and technical interviews!
  const switchDemoRole = async (roleKey) => {
    const creds = DEMO_USERS[roleKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
