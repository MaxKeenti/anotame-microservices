# Desktop Windows

Stage 3 of the apps model (`0008-apps-as-section-umbrellas.md`): on wide screens, apps open in
movable, resizable windows over the home page, so several can be on screen at once — the macOS /
PostHog-style desktop the dock and menu bar were leading to.

**When it is on.** Desktop mode is active when the viewport is at least 1024px wide — the shop's
touch tablets included — and the user has not turned "Abrir apps en ventanas" off in the menu bar's
logo menu. Below that, or with the toggle off, every app opens full-page as before. Leaving desktop
mode lands on the focused window's page as a normal route.

**One window per app.** `windowsStore` (`src/lib/desktop/windows.svelte.ts`) keeps one window per
app, like macOS apps: its URL, its own back history, geometry, stacking order, and
minimized/maximized state. The desktop is saved per user on the device
(`localStorage`, `anotame:desktop:<username>`) and restored on sign-in, dropping apps the user can
no longer open.

**How a window renders a route.** SvelteKit renders one route at a time, so a window mounts its
route itself:

1. `preloadData(url)` runs the route's real `load` chain (the admin guard, the settings form's
   server load, the KPI redirect), exactly as a navigation would.
2. `matchWindowRoute` (`src/lib/desktop/route-registry.ts`) maps the URL to its page and layout
   components, built with `import.meta.glob` from the route files — new pages need no
   registration.
3. `RouteStack` nests the layouts around the page with the loaded `data`.

**Pages follow their frame, not the app.** A page inside a window must read its params and navigate
within that window. Pages and the components they render use `useRoute()`
(`src/lib/desktop/route-context.svelte.ts`), which returns the window's URL, params, `goto`, and
`replaceUrl` inside a window and the global `page` / `goto` otherwise. A `goto` to another app's
route opens that app's window; to a non-app route (such as `/login`) it navigates the whole app.
`bun run lint:routes` fails if a dashboard page or a non-shell component imports `page` or `goto`
from `$app/*`.

**Links need no changes.** In desktop mode the shell captures clicks on internal links before
SvelteKit's router (which ignores clicks whose default was prevented) and opens them in windows:
inside a window a link navigates that window; from the dock, Launchpad, or menus an already-open app
is brought forward as it was. Shell navigation (menu bar, ⌘K) goes through `navigate()`, which does
the same.

**The address bar follows the focused window.** The home page stays mounted as the desktop, and the
focused window's URL is written with a shallow `replaceState`, so it can be copied or reloaded: a
reload (or any deep link) to an app route opens that route in its window over the desktop.

**The shell adapts.** The dock's dot means "window open" and its highlight the focused app; clicking
Inicio shows the desktop (minimizes every window). The menu bar's app menu and the page title follow
the focused window. The app navbar (`SectionTabs`) moves into each window.

**Touch.** Title-bar controls (close, minimize, zoom, back) and the resize corner are 44px; dragging
uses pointer events with `touch-action: none`, so moving and resizing work with a finger.

**Consequences:** Every page in the app works in a window without being rewritten; the cost was
moving eight files from `page`/`goto` to `useRoute()`, now enforced by lint. A window re-runs its
route's `load` through SvelteKit, so there is one data path for pages and windows. Windows are
client-only state; the URL records only the focused one, so a shared link opens one window, not a
whole desktop.
