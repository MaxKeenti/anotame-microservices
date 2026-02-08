"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LoginRequest, RegisterRequest } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (creds: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data: { token: string; user: User } = await res.json();
      const token = data.token;

      // Store token
      localStorage.setItem("token", token);

      // Use real user data from response
      const userObj: User = {
        ...data.user,
        role: data.user.role || "EMPLOYEE"
      };

      localStorage.setItem("user", JSON.stringify(userObj));
      setUser(userObj);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      const resData: { token: string; user: User } = await res.json();
      const token = resData.token;

      localStorage.setItem("token", token);

      const userObj: User = {
        ...resData.user,
        role: resData.user.role || "EMPLOYEE"
      };

      localStorage.setItem("user", JSON.stringify(userObj));
      setUser(userObj);

      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      throw error; // Let component handle UI error
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user, token: typeof window !== 'undefined' ? localStorage.getItem("token") : null }}>
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
