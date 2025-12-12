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
    // TODO: Replace with actual API call to identity-service
    // Mock Login Logic
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate latency
    
    const mockUser: User = {
      id: "uuid-123",
      username: creds.username,
      email: "demo@anotame.com",
      role: "ADMIN",
      firstName: "Admin",
      lastName: "User",
    };
    
    const mockToken = "jwt-token-placeholder";

    localStorage.setItem("token", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));
    setUser(mockUser);
    
    setIsLoading(false);
    router.push("/dashboard");
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
