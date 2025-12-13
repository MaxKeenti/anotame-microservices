"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LoginRequest } from "@/types/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (creds: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
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

      const data: { token: string } = await res.json();
      const token = data.token;
      
      // Store token
      localStorage.setItem("token", token);
      
      // In a real app, we would decode the token to get user details
      // For now, we'll set a placeholder user based on the username
      const userObj: User = {
        id: "placeholder-id",
        username: creds.username,
        email: "user@anotame.com",
        role: "EMPLOYEE", // Default
        firstName: creds.username,
        lastName: "",
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
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
