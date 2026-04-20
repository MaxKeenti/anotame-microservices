# Phase 22: i18n Naming Convention + Locale Infrastructure — Research

**Researched:** 2026-04-19
**Phase Requirements:** I18N-01, I18N-06, I18N-07

## RESEARCH COMPLETE

## 1. Paraglide JS v2 Setup for SvelteKit (No URL Prefixes)

### Installation
```bash
npx @inlang/paraglide-js@latest init
```
This creates `project.inlang/settings.json` and updates `.gitignore`.

### Vite Plugin Configuration
```typescript
// vite.config.ts
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
    })
  ]
});
```

**Key finding:** The `paraglideVitePlugin` must be in the plugins array. Order doesn't matter — it hooks into Vite's build pipeline independently. The `outdir` generates `$lib/paraglide/` with typed message functions.

### Cookie Strategy (No URL Prefixes)
Paraglide v2 supports a `cookie` strategy that avoids URL-prefixed locales (`/en/...`, `/es/...`). This is exactly what Anotame needs — a B2B app with no SEO benefit from URL-based locale routing.

**project.inlang/settings.json** configuration:
```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "sourceLanguageTag": "es",
  "languageTags": ["es", "en"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js"
  ],
  "plugin.inlang.messageFormat": {
    "pathPattern": "./messages/{languageTag}.json"
  }
}
```

### Generated Files
After running the Vite plugin, `src/lib/paraglide/` will contain:
- `messages.js` — All message functions (`m.auth.login()`, etc.)
- `runtime.js` — `setLocale()`, `getLocale()`, `isAvailableLocale()`
- `server.js` — `paraglideMiddleware()` for SSR

### app.html Update
```html
<html lang="%lang%">
```
The `%lang%` placeholder is replaced by `transformPageChunk` in hooks.server.ts.

## 2. hooks.server.ts Integration

### Current State
The existing `hooks.server.ts` (152 lines) is a pure BFF proxy that forwards `/api/*` requests to backend services. It:
- Resolves backend URLs based on path segments
- Forwards Authorization, Content-Type, Cookie headers
- Returns proxied responses

### Paraglide Middleware Integration
Paraglide v2 provides `paraglideMiddleware` from `$lib/paraglide/server`. This must run BEFORE the proxy logic.

**Critical finding:** `paraglideMiddleware` uses `AsyncLocalStorage` for request isolation — `getLocale()` works correctly in async contexts without passing locale through function arguments.

### Proposed hooks.server.ts Structure
```typescript
import { paraglideMiddleware } from '$lib/paraglide/server';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Locale resolution (BEFORE proxy)
  return paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;
    
    // 2. Proxy logic (existing — unchanged)
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api/')) {
      // ... existing proxy logic ...
    }
    
    // 3. Normal page rendering with locale
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%lang%', locale)
    });
  });
};
```

### Custom Locale Detection Order
Since we use a cookie strategy (not URL prefixes), the detection order is:
1. Read `locale` cookie from request → if valid (`es` or `en`), use it
2. If no cookie → read `Accept-Language` header (for anonymous/login page)
3. Final fallback → `es` (sourceLanguageTag)

**Important:** The `paraglideMiddleware` may handle this automatically if configured with cookie strategy. If not, we manually read the cookie in the middleware callback and call `setLocale()`.

## 3. Identity Service Changes

### Current Data Model

**tca_user table (V1__baseline.sql):**
```sql
CREATE TABLE tca_user (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_role UUID NOT NULL REFERENCES cca_role(id_role),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);
```

**User.java entity** — JPA entity with `@Getter @Setter`, soft delete, audit timestamps. No `locale` field.

**UserResponse.java DTO** — Returns `id, username, email, firstName, lastName, role`. No `locale` field.

**AuthResponse.java DTO** — Contains `token` (JWT string) and `user` (UserResponse). Login endpoint returns `Response.ok(authResponse.getUser())` with JWT in HttpOnly cookie.

**AuthService.java** — Builds UserResponse in `login()` at line 41-48 and `getUser()` at line 60-67 with `.build()` pattern. Locale must be added to both.

### V2 Migration
```sql
-- V2__add_user_locale.sql
ALTER TABLE tca_user ADD COLUMN locale VARCHAR(10) DEFAULT 'es-MX' NOT NULL;
```

**Note:** Using `es-MX` (not `es`) as default because the project's `sourceLanguageTag` in Paraglide is `es` but the user-facing label should be more specific. The Paraglide language tag mapping is `es-MX → es` for message resolution. Need to decide: should the DB store `es-MX` or `es`? Recommend storing Paraglide-compatible tags (`es`, `en`) in the DB for simplicity, and mapping to display labels in the frontend only.

### Required Changes to Identity Service

**Files to modify:**
1. `V2__add_user_locale.sql` — New Flyway migration
2. `User.java` — Add `locale` field with `@Column(name = "locale")`
3. `UserResponse.java` — Add `locale` field
4. `AuthService.java` — Add `.locale(user.getLocale())` to all UserResponse builders (lines 41-48, 60-67, 109-116)
5. `UserController.java` — Add PATCH endpoint: `PATCH /{id}/locale`
6. New DTO: `UpdateLocaleRequest.java` with `locale` field + validation

### New PATCH Endpoint
```java
@PATCH
@Path("/{id}/locale")
@io.quarkus.security.Authenticated
public Response updateLocale(@PathParam("id") UUID id, UpdateLocaleRequest request) {
    userService.updateLocale(id, request.getLocale());
    return Response.noContent().build();
}
```

**Validation:** Only `es` and `en` are valid. Reject anything else with 400.

## 4. Frontend Changes

### AuthService Changes (auth.svelte.ts)

**Current User interface:**
```typescript
export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}
```

**New User interface:**
```typescript
export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    locale: string;  // 'es' | 'en'
}
```

The login response already stores the full UserResponse in `PersistedState<User>`, so adding `locale` here is seamless.

### Locale Cookie Management

On login success, after storing user data:
```typescript
document.cookie = `locale=${response.locale};path=/;max-age=${60*60*24*365};SameSite=Lax`;
```

On locale change in settings:
```typescript
async changeLocale(newLocale: string) {
    await apiService.request(`${API_IDENTITY}/users/${this.user!.id}/locale`, {
        method: 'PATCH',
        body: JSON.stringify({ locale: newLocale })
    });
    this.userState.current = { ...this.user!, locale: newLocale };
    document.cookie = `locale=${newLocale};path=/;max-age=${60*60*24*365};SameSite=Lax`;
    // Paraglide soft swap
    setLocale(newLocale);
    invalidateAll();
}
```

### Settings Page Update

**Current placeholder (lines 143-151 of settings/+page.svelte):**
```svelte
<Card.Root>
    <Card.Header>
      <Card.Title>Idioma (Próximamente)</Card.Title>
      <Card.Description>Configuración de idioma en progreso mediante Paraglide.</Card.Description>
    </Card.Header>
    <Card.Content>
      <p class="text-sm text-muted-foreground">Las traducciones están en desarrollo.</p>
    </Card.Content>
</Card.Root>
```

**Replace with working locale select:**
```svelte
<Card.Root>
    <Card.Header>
      <Card.Title>Idioma</Card.Title>
      <Card.Description>Selecciona tu idioma preferido.</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant={currentLocale === 'es' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => changeLocale('es')}
        >
          <GlobeIcon class="w-6 h-6" />
          Español (México)
        </Button>
        <Button
          variant={currentLocale === 'en' ? 'default' : 'outline'}
          class="h-24 flex flex-col gap-2 touch-manipulation"
          onclick={() => changeLocale('en')}
        >
          <GlobeIcon class="w-6 h-6" />
          English
        </Button>
      </div>
    </Card.Content>
</Card.Root>
```

**Design pattern:** Matches the existing theme buttons (Light/Dark/System) — 3-column grid on sm+, stacked on mobile. Uses native-language labels as decided in CONTEXT.md.

## 5. Naming Convention (SEED-002)

### Convention Document
From FEATURES.md research: `domain.component.purpose` with max 3 segments, camelCase.

**Domain buckets:** `auth`, `order`, `customer`, `catalog`, `dashboard`, `settings`, `common`, `nav`, `error`

**Lint regex:** `/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$/`

### Lint Implementation Options

| Option | Pros | Cons |
|--------|------|------|
| Vitest test | Runs with `bun run test`, CI-friendly | Requires test framework setup if not present |
| Standalone script | No dependencies, can run with `bun run lint:i18n` | Not integrated into existing pipeline |
| eslint-plugin-i18n-keys | Standard tooling | Overkill for 2 rules |

**Recommendation:** Standalone script added as `bun run lint:i18n` in package.json. Reads all JSON files in `messages/`, validates every key against the regex. Zero dependencies.

### Seed Messages for Pipeline Validation
To prove the pipeline works end-to-end, extract 5-10 strings from the settings page only. These serve as a smoke test that Paraglide compiles, SSR works, and the locale switcher actually changes text. Full extraction is Phase 23.

Candidate seed keys:
```json
{
  "settings.page.title": "Preferencias",
  "settings.page.description": "Configura tu experiencia y visualización del sistema.",
  "settings.appearance.title": "Apariencia",
  "settings.appearance.description": "Personaliza el tema visual para la aplicación.",
  "settings.language.title": "Idioma",
  "settings.language.description": "Selecciona tu idioma preferido.",
  "settings.theme.light": "Claro",
  "settings.theme.dark": "Oscuro",
  "settings.theme.system": "Sistema"
}
```

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Paraglide v2 API changed since research | MEDIUM | Run `npx @inlang/paraglide-js@latest init` and verify generated files match docs. If API differs, adapt hooks.server.ts accordingly. |
| `paraglideMiddleware` conflicts with existing proxy | LOW | Middleware wraps `resolve()` — proxy logic runs inside the callback, not competing with it. |
| V2 migration on production DB | LOW | Additive-only (new column with default value). No data migration needed. Safe for live clients. |
| Cookie not set on first login after migration | MEDIUM | Existing users won't have locale cookie until they re-login. `Accept-Language` fallback handles this gracefully — after re-login, cookie is set. |
| localStorage `auth_user` stale after migration | MEDIUM | Existing PersistedState has no `locale` field. On next login, the full UserResponse (now including `locale`) replaces it. Between migration and re-login, `authService.user.locale` is `undefined` — frontend defaults to `es`. |

## 7. Validation Architecture

### Testable Claims
1. `bun run dev` starts without errors after Paraglide init
2. `bun run build` completes after Paraglide init
3. Message files exist at `messages/es.json` and `messages/en.json`
4. `src/lib/paraglide/` directory exists with generated code
5. Settings page renders locale buttons (not "Próximamente" placeholder)
6. Changing locale updates text on settings page (seed strings only)
7. `locale` cookie is set after login
8. `hooks.server.ts` reads locale cookie and sets `lang` attribute on `<html>`
9. Flyway V2 migration adds `locale` column to `tca_user`
10. PATCH `/users/{id}/locale` endpoint returns 204 with valid locale
11. Lint script validates all message keys against naming convention regex

### Verification Commands
```bash
# Frontend builds
cd anotame-web && bun run build

# Paraglide generated
test -d anotame-web/src/lib/paraglide

# Message files exist
test -f anotame-web/messages/es.json && test -f anotame-web/messages/en.json

# Lint passes
bun run lint:i18n

# Backend compiles
cd anotame-api/backend/identity-service && ./mvnw quarkus:build
```

---

*Research completed: 2026-04-19*
*Ready for planning: yes*
