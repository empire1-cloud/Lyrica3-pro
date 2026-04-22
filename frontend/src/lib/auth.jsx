import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, fetchMe, logoutUser } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (handle, password) => {
    const r = await loginUser(handle, password);
    setUser({ handle: r.handle, wallet: r.wallet });
    return r;
  };
  const register = async (handle, password) => {
    const r = await registerUser(handle, password);
    setUser({ handle: r.handle, wallet: r.wallet });
    return r;
  };
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("logout request failed", err);
      }
    }
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}
