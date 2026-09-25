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

**Sizing windows, like macOS.** The menu bar's **Ventana** menu acts on the focused window:
Minimize, Zoom, Fill, Center, *Move & Resize* (halves and quarters, with an 8px gap), Bring All to
Front, and Close. Dragging a window's title bar to the top edge of the desktop fills it; to the left
or right edge tiles it to that half, with a preview of where it lands. A tiled or zoomed window
remembers its earlier size (`preTile`) and gets it back when dragged away. With a mouse, windows
resize from any edge or corner; on tablets the Ventana menu is the way to size them, since thin
edge handles do not suit a finger (the 44px bottom-right corner still works by touch).

**Wallpaper.** The home page — the desktop — shows the user's wallpaper: a preset gradient built
from theme tokens (`src/lib/config/wallpapers.ts`), or a photo they upload. The choice is per user
and follows them across devices: `/desktop/wallpaper` (a SvelteKit server endpoint) stores a small
JSON record and the photo in the Railway bucket `anotame-assets` under `users/<id>/`, identifying
the user through the identity service's `/auth/me` with their session cookie. Photos are scaled
down in the browser (≤2560px, WebP) before upload, and served back as presigned URLs signed on the
hour so the browser can cache them. This is a UI preference with no business meaning, so it lives in
the web app's server rather than a domain service. The web service reads the bucket through `S3_*`
variables that reference the bucket in each Railway environment; an environment without them
simply offers presets only.

**Settings like System Settings.** Apps can declare `nav: 'sidebar'` (Ajustes does) to show their
sections in a System Settings–style sidebar instead of a tab bar; `SectionFrame` picks the layout
with a container query, so a narrow window or phone falls back to tabs. Ajustes gained an
**Escritorio** section for the wallpaper and the windows toggle.

**Touch.** Title-bar controls (close, minimize, zoom, back) and the resize corner are 44px; dragging
uses pointer events with `touch-action: none`, so moving and resizing work with a finger.

**Consequences:** Every page in the app works in a window without being rewritten; the cost was
moving eight files from `page`/`goto` to `useRoute()`, now enforced by lint. A window re-runs its
route's `load` through SvelteKit, so there is one data path for pages and windows. Windows are
client-only state; the URL records only the focused one, so a shared link opens one window, not a
whole desktop.
