"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LoginRequest, RegisterRequest } from "@/types/auth";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { API_IDENTITY } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await apiClient<User>(`${API_IDENTITY}/auth/me`, { skipAuthRedirect: true });
        setUser(user);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (creds: LoginRequest) => {
    setIsLoading(true);
    try {
      const user = await apiClient<User>(`${API_IDENTITY}/auth/login`, {
        method: "POST",
        body: JSON.stringify(creds),
      });

      setUser(user);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const user = await apiClient<User>(`${API_IDENTITY}/auth/register`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      setUser(user);
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient(`${API_IDENTITY}/auth/logout`, { method: "POST" });
    } catch (e) {
      console.error("Logout failed", e);
    }
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user, token: null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
