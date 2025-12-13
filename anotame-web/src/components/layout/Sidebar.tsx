"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { name: "Overview", href: "/dashboard", icon: "Home" },
  { name: "New Order", href: "/dashboard/orders/new", icon: "PlusCircle" },
  { name: "Active Orders", href: "/dashboard/orders", icon: "ClipboardList" },
  { name: "Customers", href: "/dashboard/customers", icon: "Users" },
  { name: "Services", href: "/dashboard/services", icon: "Tag" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Anotame<span className="text-primary">.</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {/* Icon Placeholder */}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
