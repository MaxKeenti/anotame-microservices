"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <h1 className="text-5xl font-heading font-bold text-foreground">
          Anotame<span className="text-primary">.com</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          The management platform for modern tailor shops. 
          Manage orders, customers, and services with elegance.
        </p>
        
        <div className="flex gap-4 mt-4">
          {!isLoading && (
            isAuthenticated ? (
              <Link 
                href="/dashboard" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/register" 
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Create Account
                </Link>
                <Link 
                  href="/login"
                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                >
                  Login
                </Link>
              </>
            )
          )}
        </div>
      </main>
    </div>
  );
}
