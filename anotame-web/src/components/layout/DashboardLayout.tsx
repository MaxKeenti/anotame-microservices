"use client";

import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 px-8 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg">Tablero</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Bienvenido, <strong>{user?.username || "Usuario"}</strong></span>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
