import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem("sportify-token");
    const token = sessionStorage.getItem("sportify-token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        sessionStorage.removeItem("sportify-token");
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(email, password, role) {
      const { data } = await api.post("/auth/login", { email, password, role });
      sessionStorage.setItem("sportify-token", data.token);
      setUser(data.user);
      return data.user;
    },
    async register(name, email, password, clubDetails) {
      const { data } = await api.post("/auth/register", { name, email, password, ...clubDetails });
      sessionStorage.setItem("sportify-token", data.token);
      setUser(data.user);
      return data.user;
    },
    async registerAthlete(email, password) {
      const { data } = await api.post("/auth/athlete/register", { email, password });
      sessionStorage.setItem("sportify-token", data.token);
      setUser(data.user);
      return data.user;
    },
    async updateProfile(profile) {
      const { data } = await api.patch("/auth/me", profile);
      setUser(data.user);
      return data.user;
    },
    logout() {
      sessionStorage.removeItem("sportify-token");
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
