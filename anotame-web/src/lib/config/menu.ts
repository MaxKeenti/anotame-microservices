import HomeIcon from "lucide-svelte/icons/home";
import ClipboardListIcon from "lucide-svelte/icons/clipboard-list";
import ActivityIcon from "lucide-svelte/icons/activity";
import ShirtIcon from "lucide-svelte/icons/shirt";
import TagIcon from "lucide-svelte/icons/tag";
import DollarSignIcon from "lucide-svelte/icons/dollar-sign";
import CalendarIcon from "lucide-svelte/icons/calendar";
import SettingsIcon from "lucide-svelte/icons/settings";
import UsersIcon from "lucide-svelte/icons/users";
import UserIcon from "lucide-svelte/icons/user";

export const menuItems = [
    { name: "Inicio", href: "/dashboard", icon: HomeIcon, description: "Ir al inicio" },
    { name: "Pedidos", href: "/dashboard/orders", icon: ClipboardListIcon, description: "Ver pedidos y borradores" },
    { name: "Órdenes", href: "/dashboard/operations", icon: ActivityIcon, description: "Gestión operativa" },
    { name: "Prendas", href: "/dashboard/catalog/garments", icon: ShirtIcon, description: "Catálogo de prendas" },
    { name: "Servicios", href: "/dashboard/catalog/services", icon: TagIcon, description: "Catálogo de servicios" },
    { name: "Listas de Precios", href: "/dashboard/catalog/pricelists", icon: DollarSignIcon, description: "Gestionar precios" },
    { name: "Horarios", href: "/dashboard/admin/schedule", icon: CalendarIcon, description: "Configurar horarios" },
    { name: "Ajustes", href: "/dashboard/admin/settings", icon: SettingsIcon, description: "Configuración del sistema" },
    { name: "Empleados", href: "/dashboard/admin/users", icon: UsersIcon, description: "Gestionar personal" },
    { name: "Clientes", href: "/dashboard/customers", icon: UserIcon, description: "Gestionar clientes" },
];

export const adminOnlyItems = ["Empleados", "Ajustes", "Horarios", "Listas de Precios"];
