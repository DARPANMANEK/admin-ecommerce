import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAuthToken } from "./apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      setUser((prev) => ({ ...(prev || {}), isAdmin: true }));
    } else {
      setAuthToken(null);
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const signin = useCallback(async (email, password) => {
    const res = await api.post("/auth/signin", { email, password });
    if (res.data?.userRegistered === false) {
      return { userRegistered: false };
    }
    const t = res.data?.token;
    if (t) {
      setToken(t);
      setAuthToken(t);
      setUser({ ...res.data?.user, isAdmin: true });
    }
    return { success: true };
  }, []);

  const signout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      signin,
      signout,
      isAuthenticated: Boolean(token),
      isAdmin: Boolean(token),
    }),
    [token, user, loading, signin, signout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx;
}
