import HomeIcon from "@lucide/svelte/icons/home";
import ClipboardListIcon from "@lucide/svelte/icons/clipboard-list";
import ActivityIcon from "@lucide/svelte/icons/activity";
import ShirtIcon from "@lucide/svelte/icons/shirt";
import TagIcon from "@lucide/svelte/icons/tag";
import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import SettingsIcon from "@lucide/svelte/icons/settings";
import UsersIcon from "@lucide/svelte/icons/users";
import UserIcon from "@lucide/svelte/icons/user";
import StoreIcon from "@lucide/svelte/icons/store";
import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
import * as m from '$lib/paraglide/messages';

type MenuItem = {
    key: string;
    href: string;
    icon: typeof HomeIcon;
    getName: () => string;
    getDescription: () => string;
    showInDock?: boolean;
    showInDashboard?: boolean;
};

const menuNameMessages: Record<string, () => string> = {
    home: m["nav.home.name"],
    kpi: m["nav.kpi.name"],
    orders: m["nav.orders.name"],
    operations: m["nav.operations.name"],
    garments: m["nav.garments.name"],
    services: m["nav.services.name"],
    pricelists: m["nav.pricelists.name"],
    schedule: m["nav.schedule.name"],
    business: m["nav.business.name"],
    preferences: m["nav.preferences.name"],
    users: m["nav.users.name"],
    customers: m["nav.customers.name"],
    help: m["nav.help.name"],
};

const menuDescMessages: Record<string, () => string> = {
    home: m["nav.home.description"],
    kpi: m["nav.kpi.description"],
    orders: m["nav.orders.description"],
    operations: m["nav.operations.description"],
    garments: m["nav.garments.description"],
    services: m["nav.services.description"],
    pricelists: m["nav.pricelists.description"],
    schedule: m["nav.schedule.description"],
    business: m["nav.business.description"],
    preferences: m["nav.preferences.description"],
    users: m["nav.users.description"],
    customers: m["nav.customers.description"],
    help: m["nav.help.description"],
};

export const menuItems: MenuItem[] = [
    { key: "home", href: "/dashboard", icon: HomeIcon, getName: () => menuNameMessages.home(), getDescription: () => menuDescMessages.home(), showInDock: false, showInDashboard: false },
    { key: "kpi", href: "/dashboard/admin/kpi", icon: TrendingUpIcon, getName: () => menuNameMessages.kpi(), getDescription: () => menuDescMessages.kpi() },
    { key: "orders", href: "/dashboard/orders", icon: ClipboardListIcon, getName: () => menuNameMessages.orders(), getDescription: () => menuDescMessages.orders() },
    { key: "operations", href: "/dashboard/operations", icon: ActivityIcon, getName: () => menuNameMessages.operations(), getDescription: () => menuDescMessages.operations() },
    { key: "garments", href: "/dashboard/catalog/garments", icon: ShirtIcon, getName: () => menuNameMessages.garments(), getDescription: () => menuDescMessages.garments() },
    { key: "services", href: "/dashboard/catalog/services", icon: TagIcon, getName: () => menuNameMessages.services(), getDescription: () => menuDescMessages.services() },
    { key: "pricelists", href: "/dashboard/catalog/pricelists", icon: DollarSignIcon, getName: () => menuNameMessages.pricelists(), getDescription: () => menuDescMessages.pricelists() },
    { key: "schedule", href: "/dashboard/admin/schedule", icon: CalendarIcon, getName: () => menuNameMessages.schedule(), getDescription: () => menuDescMessages.schedule() },
    { key: "business", href: "/dashboard/admin/settings", icon: StoreIcon, getName: () => menuNameMessages.business(), getDescription: () => menuDescMessages.business() },
    { key: "users", href: "/dashboard/admin/users", icon: UsersIcon, getName: () => menuNameMessages.users(), getDescription: () => menuDescMessages.users() },
    { key: "customers", href: "/dashboard/customers", icon: UserIcon, getName: () => menuNameMessages.customers(), getDescription: () => menuDescMessages.customers() },
    { key: "help", href: "/dashboard/help", icon: CircleHelpIcon, getName: () => menuNameMessages.help(), getDescription: () => menuDescMessages.help(), showInDock: false },
    { key: "preferences", href: "/dashboard/settings", icon: SettingsIcon, getName: () => menuNameMessages.preferences(), getDescription: () => menuDescMessages.preferences(), showInDock: false },
];

export const adminOnlyItems = ["users", "business", "schedule", "pricelists", "kpi"];
