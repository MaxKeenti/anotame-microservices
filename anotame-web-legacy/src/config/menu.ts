import {
    Home,
    ClipboardList,
    Activity,
    Shirt,
    Tag,
    DollarSign,
    Calendar,
    Settings,
    Users,
    User,
} from "lucide-react";

export const menuItems = [
    { name: "Inicio", href: "/dashboard", icon: Home, description: "Ir al inicio" },
    { name: "Pedidos", href: "/dashboard/orders", icon: ClipboardList, description: "Ver pedidos y borradores" },
    { name: "Órdenes", href: "/dashboard/operations", icon: Activity, description: "Gestión operativa" },
    { name: "Prendas", href: "/dashboard/catalog/garments", icon: Shirt, description: "Catálogo de prendas" },
    { name: "Servicios", href: "/dashboard/catalog/services", icon: Tag, description: "Catálogo de servicios" },
    { name: "Listas de Precios", href: "/dashboard/catalog/pricelists", icon: DollarSign, description: "Gestionar precios" },
    { name: "Horarios", href: "/dashboard/admin/schedule", icon: Calendar, description: "Configurar horarios" },
    { name: "Ajustes", href: "/dashboard/admin/settings", icon: Settings, description: "Configuración del sistema" },
    { name: "Empleados", href: "/dashboard/admin/users", icon: Users, description: "Gestionar personal" },
    { name: "Clientes", href: "/dashboard/customers", icon: User, description: "Gestionar clientes" },
];

export const adminOnlyItems = ["Empleados", "Ajustes", "Horarios", "Listas de Precios"];
