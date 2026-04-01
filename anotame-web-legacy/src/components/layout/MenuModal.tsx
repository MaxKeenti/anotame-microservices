"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    X,
    LogOut
} from "lucide-react";
import { menuItems, adminOnlyItems } from "@/config/menu";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

interface MenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenProfile?: () => void;
}


export function MenuModal({ isOpen, onClose, onOpenProfile }: MenuModalProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Close formatting on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-full max-w-5xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold font-heading">Menú Principal</h2>
                        <p className="text-muted-foreground">Selecciona una opción para navegar</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-12 w-12 rounded-full">
                        <X className="h-8 w-8" />
                    </Button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {menuItems.filter(item => {
                            // RBAC Logic
                            const isAdmin = user?.role === 'ADMIN';

                            // Explicit Logic
                            if (adminOnlyItems.includes(item.name)) return isAdmin;

                            return true;
                        }).map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 transition-all hover:scale-105 active:scale-95
                    ${isActive
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Icon className={`w-12 h-12 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className="text-lg font-semibold text-center">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                            <div className="font-semibold">{user?.username || "Usuario"}</div>
                            <Button
                                variant="ghost"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary underline"
                                onClick={onOpenProfile}
                            >
                                Editar Credenciales
                            </Button>
                        </div>
                    </div>

                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={logout}
                        className="gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar Sesión</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
