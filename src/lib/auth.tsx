import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { api, setAuthToken, setOnUnauthorized } from "./api";

export type Role = "PARTNER" | "EXECUTIVE" | "CLIENT";

export interface JwtPayload {
  sub: string;
  role: Role;
  user_id?: string;
  email?: string;
  exp?: number;
}

export interface AuthUser {
  user_id: string;
  email: string;
  role: Role;
  full_name?: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => logout());
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      const t = res.access_token;
      setAuthToken(t);
      setTokenState(t);

      let decoded: JwtPayload | null = null;
      try {
        decoded = jwtDecode<JwtPayload>(t);
      } catch {}

      let me: any = null;
      try {
        me = await api("/auth/me");
      } catch {}

      const u: AuthUser = {
        user_id: me?.user_id || decoded?.user_id || decoded?.sub || "",
        email: me?.email || decoded?.email || email,
        role: (me?.role || decoded?.role) as Role,
        full_name: me?.full_name,
      };
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function rolePath(role: Role) {
  return role === "PARTNER" ? "/partner" : role === "EXECUTIVE" ? "/executive" : "/client";
}
