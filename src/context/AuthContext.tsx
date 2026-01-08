"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import { logout as apiLogout } from "@/lib/api/users";

export interface User {
  id: string; // We normalize _id to id internally
  nome: string;
  email: string;
  tipo: string;
  cargo?: string;
  escola?: string;
  uf?: any;
  primeiroLogin?: boolean;
}

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
};

const AUTH_USER_KEY = "gh_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);

  // Initialize auth state from cookie and localStorage
  useEffect(() => {
    const sessionToken = Cookies.get("gh_session");
    const savedUser =
      typeof window !== "undefined" ? localStorage.getItem(AUTH_USER_KEY) : null;

    if (sessionToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUserState(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        // Clear invalid data
        localStorage.removeItem(AUTH_USER_KEY);
        Cookies.remove("gh_session");
      }
    }

    setIsLoading(false);
  }, []);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);

    if (typeof window === "undefined") return;

    if (newUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, []);

  const login = useCallback(
    (userData: User) => {
      setIsAuthenticated(true);
      setUser(userData);
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    // Call API to clear session token on backend
    if (user?.id) {
      try {
        await apiLogout(user.id);
      } catch (error) {
        console.error("Failed to logout on backend:", error);
        // Continue with local logout even if API fails
      }
    }

    setIsAuthenticated(false);
    setUserState(null);

    if (typeof window === "undefined") return;

    localStorage.removeItem(AUTH_USER_KEY);
  }, [user]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      setUser,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, user, setUser, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
