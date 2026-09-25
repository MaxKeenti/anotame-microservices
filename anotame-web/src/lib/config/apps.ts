import RocketIcon from "@lucide/svelte/icons/rocket";
import HomeIcon from "@lucide/svelte/icons/home";
import ConciergeBellIcon from "@lucide/svelte/icons/concierge-bell";
import ShirtIcon from "@lucide/svelte/icons/shirt";
import ChartLineIcon from "@lucide/svelte/icons/chart-line";
import SettingsIcon from "@lucide/svelte/icons/settings";
import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
import * as m from '$lib/paraglide/messages';
import { menuItems, adminOnlyItems, type MenuItem } from './menu';

/**
 * An app groups related sections (menu items) under one dock icon, with its own
 * section navbar. Apps are a layer over the existing routes: membership is
 * decided by the sections' hrefs, so no URL changes. See docs/adr/0008.
 */
export type AppDef = {
    key: string;
    icon: typeof RocketIcon;
    getName: () => string;
    /** `menuItems` keys, in navbar order. */
    sections: string[];
    showInDock?: boolean;
    /** How the app moves between sections: a tab bar, or a sidebar like System Settings. */
    nav?: 'tabs' | 'sidebar';
};

/** An app narrowed to the sections the current user can open. */
export type VisibleApp = { app: AppDef; sections: MenuItem[] };

/** The home page, pinned as the first dock tile (like Finder). */
export const home = {
    href: "/dashboard",
    icon: HomeIcon,
    getName: () => m["nav.home.name"](),
};

/** Overlay grid of every app, opened from the last dock tile. */
export const launchpad = {
    icon: RocketIcon,
    getName: () => m["nav.launchpad.name"](),
};

export const apps: AppDef[] = [
    { key: "frontDesk", icon: ConciergeBellIcon, getName: () => m["nav.app.frontDesk"](), sections: ["orders", "operations", "customers"] },
    { key: "catalog", icon: ShirtIcon, getName: () => m["nav.app.catalog"](), sections: ["garments", "services", "pricelists"] },
    { key: "metrics", icon: ChartLineIcon, getName: () => m["nav.app.metrics"](), sections: ["kpi"] },
    { key: "settings", icon: SettingsIcon, getName: () => m["nav.app.settings"](), sections: ["preferences", "desktop", "business", "schedule", "users"], nav: "sidebar" },
    { key: "help", icon: CircleHelpIcon, getName: () => m["nav.app.help"](), sections: ["help"], showInDock: false },
];

const itemsByKey = new Map(menuItems.map((item) => [item.key, item]));

export function isSectionVisible(item: MenuItem, isAdmin: boolean): boolean {
    return adminOnlyItems.includes(item.key) ? isAdmin : true;
}

/** Apps with at least one section the user may open; the rest are hidden. */
export function visibleApps(isAdmin: boolean): VisibleApp[] {
    return apps
        .map((app) => ({
            app,
            sections: app.sections
                .map((key) => itemsByKey.get(key))
                .filter((item): item is MenuItem => !!item && isSectionVisible(item, isAdmin)),
        }))
        .filter((entry) => entry.sections.length > 0);
}

/** Longest-prefix match, so detail pages such as /dashboard/orders/[id] resolve to their section. */
export function resolveSection(pathname: string): MenuItem | undefined {
    return menuItems
        .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0];
}

/** The app owning the current URL; undefined on the home page. */
export function resolveApp(pathname: string): { app: AppDef; section: MenuItem } | undefined {
    const section = resolveSection(pathname);
    if (!section) return undefined;
    const app = apps.find((a) => a.sections.includes(section.key));
    return app ? { app, section } : undefined;
}

/** Where an app opens: its last-visited section if the user can still see it, else its first. */
export function openHref(entry: VisibleApp, lastSectionHref?: string): string {
    return entry.sections.some((section) => section.href === lastSectionHref)
        ? lastSectionHref!
        : entry.sections[0].href;
}
