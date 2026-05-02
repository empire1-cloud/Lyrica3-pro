import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, fetchMe } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("e1_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchMe()
      .then(u => setUser(u))
      .catch(() => { localStorage.removeItem("e1_token"); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (handle, password) => {
    const r = await loginUser(handle, password);
    localStorage.setItem("e1_token", r.token);
    setToken(r.token);
    setUser({ handle: r.handle, wallet: r.wallet });
    return r;
  };
  const register = async (handle, password) => {
    const r = await registerUser(handle, password);
    localStorage.setItem("e1_token", r.token);
    setToken(r.token);
    setUser({ handle: r.handle, wallet: r.wallet });
    return r;
  };
  const logout = () => { localStorage.removeItem("e1_token"); setToken(null); setUser(null); };

  return <AuthCtx.Provider value={{ user, token, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}
