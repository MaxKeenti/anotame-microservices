"use client";

import Link from "next/link";
import { menuItems, adminOnlyItems } from "@/config/menu";
import { useAuth } from "@/context/AuthContext";
import { DashboardHeader } from "./components/DashboardHeader";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const visibleItems = menuItems.filter((item) => {
    if (adminOnlyItems.includes(item.name)) return isAdmin;
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description || "Navegar a " + item.name}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

