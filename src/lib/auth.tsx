"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { api, setAuthToken, setOnUnauthorized } from "./api";

const AUTH_TOKEN_KEY = "itr-platform-auth-token";

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
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setAuthToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);

      const isProduction = process.env.NODE_ENV === "production";
      document.cookie =
        `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${isProduction ? "; Secure" : ""}`;
    }
    setTokenState(null);
    setUser(null);
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => logout());
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const storedToken =
          typeof window !== "undefined"
            ? window.localStorage.getItem(AUTH_TOKEN_KEY)
            : null;
        if (!storedToken) {
          if (!cancelled) {
            setAuthToken(null);
            setTokenState(null);
            setUser(null);
          }
          return;
        }

        setAuthToken(storedToken);
        if (!cancelled) setTokenState(storedToken);

        // TODO: Remove this hard-coded value and use an environment variable instead
        if (typeof window !== "undefined") {
          const isProduction = process.env.NODE_ENV === "production";
          document.cookie = `token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict${isProduction ? "; Secure" : ""}`;
        }

        let decoded: JwtPayload | null = null;
        try {
          decoded = jwtDecode<JwtPayload>(storedToken);
        } catch {
          decoded = null;
        }

        let me: Partial<AuthUser> | null = null;
        try {
          me = await api<Partial<AuthUser>>("/auth/me");
        } catch {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
          }
          setAuthToken(null);
          if (!cancelled) {
            setTokenState(null);
            setUser(null);
          }
          return;
        }

        if (cancelled) return;
        const hydratedUser: AuthUser = {
          user_id: me?.user_id || decoded?.user_id || decoded?.sub || "",
          email: me?.email || decoded?.email || "",
          role: (me?.role || decoded?.role) as Role,
          full_name: me?.full_name,
        };
        setUser(hydratedUser);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api<{ access_token: string; token_type: string }>(
        "/auth/login",
        {
          method: "POST",
          body: { email, password },
          auth: false,
        },
      );
      const t = res.access_token;
      setAuthToken(t);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTH_TOKEN_KEY, t);

        const isProduction = process.env.NODE_ENV === "production";
        document.cookie = `token=${t}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict${isProduction ? "; Secure" : ""}`;
      }
      setTokenState(t);

      let decoded: JwtPayload | null = null;
      try {
        decoded = jwtDecode<JwtPayload>(t);
      } catch {
        decoded = null;
      }

      let me: Partial<AuthUser> | null = null;
      try {
        me = await api<Partial<AuthUser>>("/auth/me");
      } catch {
        me = null;
      }

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

export function rolePath(role?: string) {
  // if (!role) return "/client";

  const normalizedRole = role?.toUpperCase();

  switch (normalizedRole) {
    case "PARTNER":
      return "/partner";
    case "EXECUTIVE":
      return "/executive";
    case "ADMIN":
      return "/admin";
    case "CLIENT":
    default:
      return "/client";
  }
}
