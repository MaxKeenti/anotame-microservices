# Apps as Section Umbrellas

The authenticated shell of `anotame-web` already looks like a macOS desktop: a floating, magnifying
dock with a running-app dot. What the dock held, though, were eleven individual sections (orders,
garments, services, price lists, users…), so it behaved like a sidebar laid on its side: it ran out
of width, pushed sections into a "recents" overflow, and gave related screens (the three catalog
CRUDs, the settings pages) no shared home. The KPI dashboard was the only place that felt like an
app — one entry with its own tab bar across three sections.

The decision is to treat the web app as an OS that hosts a few **apps**, each an umbrella over
related **sections**:

| App | Sections |
|---|---|
| Mostrador (front desk) | orders, operations, customers |
| Catálogo | garments, services, price lists |
| Métricas | KPI (which keeps its own operación / dinero / clientes tabs) |
| Ajustes | preferences, business, schedule, users |
| Ayuda | help (not pinned to the dock) |

How it is built:

- **Apps are a layer over routes, not a route structure.** `src/lib/config/apps.ts` lists each
  app's sections as `menuItems` keys. `resolveApp(pathname)` finds the owning app by longest-prefix
  match on the sections' hrefs, so every existing URL — including detail pages and shared links —
  keeps working and nothing moved on disk.
- **A section is still the unit of access.** Admin gating stays per section (`adminOnlyItems`); an
  app shows only the sections its user may open, and disappears when none are left.
- **The dock lists apps.** The home tile (`/dashboard`) is pinned first (like Finder), then the
  pinned apps, then recently opened apps that did not fit, then the Launchpad. Reopening an app returns
  to the section it was left on (`appSessionStore`, in memory for the session), which is what makes
  the dock feel like switching between running apps rather than following links.
- **Multi-section apps get a navbar.** The `(app)` layout renders `SectionTabs` above the page when
  the current app has more than one visible section. KPI keeps its own `SectionTabs` inside its
  layout; being a single-section app, it never gets a second bar.
- **The Launchpad is the menu.** The overlay opened from the dock's last tile (or the home page's
  button) is a grid of apps, each described by the sections it contains, plus the account actions
  (edit credentials, sign out). There is no separate section-level menu: inside an app, its navbar
  reaches the sections. The home page is just the logo, a greeting, and the admin's week widget.
- **Document titles** read `Section · App · Anotame`, derived from the same resolution.

**Adding a section** means adding a `menuItems` entry and listing its key in one app's `sections`.
**Adding an app** means one entry in `apps` plus its `nav.app.*` message keys.

**Consequences:** The dock is bounded by the number of apps (five for an admin) instead of the
number of screens, so it fits a phone with room for a recent app. Related screens now share
navigation without any page component changing. The cost is one indirection: where a section
appears in the dock is decided in `apps.ts`, not `menu.ts`.

The model is staged so later steps build on it rather than replace it:

1. **Apps over routes** — this decision.
2. **Desktop chrome, still route-based** — *done in #56.* From `md` up, `MenuBar` shows the logo
   menu (Inicio, Launchpad, search), the current app's sections, a "Go" menu of every app, search,
   the clock, and the account menu; its targets are 44px because the shop runs on touch screens.
   `CommandPalette` (⌘K / Ctrl+K) searches apps, sections, and quick actions. The dock's dot now
   marks every app opened this session, as on macOS, while the highlight marks the current one.
   Route groups were not needed: grouping lives in `apps.ts`.
3. **Windows** — several apps on screen at once, PostHog-style. SvelteKit renders one route at a
   time; a second route can be shown in a window with shallow routing (`preloadData` + `pushState`),
   but pages that read `page.url` / `page.params` or call `goto()` directly would act on the main
   URL. Each app's pages must first take their params and navigation from a context (window or full
   page). The app boundaries from step 1 define what migrates together, one app at a time.
