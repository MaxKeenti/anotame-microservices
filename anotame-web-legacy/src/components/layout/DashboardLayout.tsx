"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { MenuModal } from "./MenuModal";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { CredentialsModal } from "../profile/CredentialsModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenProfile={() => { setIsMenuOpen(false); setIsProfileOpen(true); }}
      />
      <CredentialsModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h2 className="font-heading font-semibold text-lg">Anotame.</h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm text-muted-foreground">Bienvenido, <strong>{user?.username || "Usuario"}</strong></span>
          <div
            className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold cursor-pointer"
            onClick={() => setIsMenuOpen(true)}
          >
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
