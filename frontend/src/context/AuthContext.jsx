import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { setAccessToken } from "../services/session";
import realtime from "../services/websocket";
import { loadPreferences, clearPreferences } from "../services/preferences";

const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshProfile = async () => {
    const res = await api.get("/auth/me");
    if (!res.success) throw new Error("Unable to load profile");
    setUser(res.data);
    return res.data;
  };
  useEffect(() => {
    let active = true;
    api
      .get("/auth/me")
      .then((res) => {
        if (active && res.success) setUser(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => {
      setUser(null);
      realtime.disconnect();
    };
    window.addEventListener("session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  useEffect(() => {
    if (user) {
      realtime.connect();
      loadPreferences().catch(() => {});
    } else {
      realtime.disconnect();
      clearPreferences();
    }
  }, [user?.id]);
  const authenticate = async (path, payload) => {
    const res = await api.post(path, payload);
    if (!res.success || !res.data?.accessToken)
      throw new Error(res.message || "Authentication failed");
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };
  const login = (email, password) =>
    authenticate("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });
  const register = (fullName, email, phone, password) =>
    authenticate("/auth/register", {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
    });
  const logout = async () => {
    try {
      await api.post("/auth/logout", {});
    } finally {
      setAccessToken(null);
      setUser(null);
      realtime.disconnect();
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        isDemoMode: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
export default AuthContext;
