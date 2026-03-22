---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Application Manager (Svelte 5 + SvelteKit)

- **Framework**: Svelte 5, SvelteKit, svelte-shadcn for UI components
- **Styling**: Only use Tailwind classes, no custom CSS
- **Dark mode**: Let shadcn handle it, do not manage manually
- **Components**: Do not create new UI components unless absolutely necessary - use shadcn components
- **State management**: Use Svelte 5 runes ($state, $derived, etc.) and Runed for service-like signals

### Service Pattern (Runed-based)

Services use a class-based singleton pattern with Runed utilities for reactivity and persistence.

**File naming**: `src/lib/services/<name>.svelte.ts`

**Structure**:
```ts
import { PersistedState } from 'runed';

class MyService {
  // Use PersistedState for data that should survive page reloads
  private dataState = new PersistedState<MyData | null>('storage_key', null);

  // Expose reactive getters
  get data(): MyData | null {
    return this.dataState.current;
  }

  get isReady(): boolean {
    return this.data !== null;
  }

  // Methods for business logic
  async doSomething(): Promise<void> {
    // Update state via .current
    this.dataState.current = newValue;
  }
}

// Export singleton instance
export const myService = new MyService();
```

**Usage in components**:
```svelte
<script lang="ts">
  import { myService } from '$lib/services/my-service.svelte';

  // Reactive - updates when service state changes
  const isReady = $derived(myService.isReady);
</script>
```

### Internationalization (Paraglide)

Use Paraglide for i18n. Never hardcode user-facing text.

**Message files**: `messages/en.json`, `messages/es.json`

**Adding translations**:
```json
{
  "feature_label": "English text",
  "feature_success": "Feature successfully added"
}
```

**Note**: Do not use parameterized messages for translations. Instead, use specific, unparameterized keys like `feature_success` rather than `common_success` with dynamic `subject` and `operation`.

**Usage in components**:
```svelte
<script lang="ts">
  import * as m from '$lib/paraglide/messages';
</script>

<h1>{m.feature_label()}</h1>
<p>{m.feature_success()}</p>
```

**Naming convention**: Use `snake_case` with feature prefix (e.g., `login_title`, `home_welcome`, `common_logout`)

### Route Structure

- `/` - Public routes (login, uses `useGuestGuard` to redirect if already authenticated)
- `/(app)/` - Authenticated routes (uses `useAuthGuard` to redirect if not authenticated)
  - `/(app)/home/` - Home page after login

### Auth Guards

Guards are client-side route protection utilities using Svelte 5 runes. Located in `src/lib/guards/`.

**Note**: For server-side protection, use `hooks.server.ts` with httpOnly cookies. Current implementation is client-side only (Cognito tokens in localStorage).

**Available guards**:
- `useAuthGuard(redirectTo)` - Protects routes requiring authentication
- `useGuestGuard(redirectTo)` - Protects routes for unauthenticated users only (e.g., login)

**Usage in layouts/pages**:
```svelte
<script lang="ts">
  import { useAuthGuard } from '$lib/guards';

  let { children } = $props();
  const guard = useAuthGuard('/'); // redirect to login if not authenticated
</script>

{#if guard.checking}
  <LoadingSpinner />
{:else if guard.allowed}
  {@render children()}
{/if}
```

**Guard returns**:
- `checking: boolean` - True while verifying auth state
- `allowed: boolean` - True if user can access the route

### Services Architecture

Services are located in `src/lib/services/` and exported from `src/lib/services/index.ts`.

**Core Services**:

1. **cognitoService** (`cognito.svelte.ts`) - AWS Cognito authentication
   - Token management with `PersistedState` (survives page reloads)
   - Login, logout, token refresh, password change
   - JWT decoding and group validation
   - Uses `@aws-sdk/client-cognito-identity-provider`

2. **authService** (`auth.svelte.ts`) - High-level auth facade
   - Wraps cognitoService with session management
   - Auto token refresh scheduling
   - Re-exports errors: `AuthenticationChallengeError`, `UnauthorizedGroupError`

3. **graphqlService** (`graphql.svelte.ts`) - Apollo Client setup
   - Connects to AWS AppSync
   - Auth middleware auto-injects access token
   - Uses `@apollo/client/core` (not React bindings)

4. **apiService** (`api.svelte.ts`) - Centralized API requests
   - Typed GraphQL operations using `graphql-types` package
   - Methods for each entity (e.g., `getInstituciones()`, `saveInstitucion()`)

**GraphQL Service Pattern**:
```ts
import { ApolloClient, ApolloLink, concat, HttpLink, InMemoryCache } from '@apollo/client/core';
import { cognitoService } from './cognito.svelte';
import { PUBLIC_APPSYNC_ENDPOINT } from '$env/static/public';

class GraphQLService {
  client: ApolloClient<NormalizedCacheObject>;

  constructor() {
    const httpLink = new HttpLink({ uri: PUBLIC_APPSYNC_ENDPOINT });
    const authMiddleware = new ApolloLink((operation, forward) => {
      operation.setContext(({ headers = {} }) => ({
        headers: {
          ...headers,
          Authorization: cognitoService.tokens?.accessToken ?? ''
        }
      }));
      return forward(operation);
    });
    this.client = new ApolloClient({
      link: concat(authMiddleware, httpLink),
      cache: new InMemoryCache()
    });
  }
}

export const graphqlService = new GraphQLService();
```

**API Service Pattern**:
```ts
import { gql } from '@apollo/client/core';
import { graphqlService } from './graphql.svelte';
import type { Institucion } from 'graphql-types';

const GET_INSTITUCIONES = gql`
  query GetInstituciones {
    tgInstituciones { id nombre }
  }
`;

class ApiService {
  async getInstituciones(): Promise<Institucion[]> {
    const result = await graphqlService.client.query<{ tgInstituciones: Institucion[] }>({
      query: GET_INSTITUCIONES,
      fetchPolicy: 'network-only'
    });
    return result.data.tgInstituciones;
  }
}

export const apiService = new ApiService();
```

### Workspace Packages

Three shared packages live in `packages/`:

1. **`graphql-types`** — Type-safe GraphQL types generated from the schema
   ```ts
   import type { Institucion, InstitucionSave } from 'graphql-types';
   ```

2. **`api-errors`** — Error code constants and extraction utility for GraphQL error handling
   ```ts
   import { VWD_CODES, extractErrorCode } from 'api-errors';
   ```

3. **`date-utils`** — Date/time parsing, formatting, and utility functions aligned with the backend `DD/MM/YYYY HH:MM:SS` format (Mexico City timezone)
   ```ts
   import { parseBackendDateTime, toBackendDateTime, formatDateTime, formatDate, formatISODate, formatDuration, getFullName, MEXICO_CITY_TZ } from 'date-utils';
   ```

All are referenced as `"workspace:*"` in each app's `package.json` dependencies.

### Data Tables (TanStack Table + shadcn)

Use `DataTableWrapper` component for consistent tables with search and pagination.

**Location**: `src/lib/components/data-table-wrapper.svelte`

**Usage**:
```svelte
<script lang="ts">
  import DataTableWrapper from '$lib/components/data-table-wrapper.svelte';
  import { renderSnippet } from '$lib/components/ui/data-table';
  import type { ColumnDef } from '@tanstack/table-core';

  const columns: ColumnDef<MyType>[] = [
    {
      accessorKey: 'name',
      header: () => m.column_name()
    },
    {
      id: 'actions',
      header: () => m.column_actions(),
      cell: ({ row }) => renderSnippet(actionsCell, row.original)
    }
  ];
</script>

{#snippet actionsCell(item: MyType)}
  <Button onclick={() => handleEdit(item)}>Edit</Button>
{/snippet}

<DataTableWrapper
  data={items}
  {columns}
  {loading}
  searchPlaceholder={m.search_placeholder()}
  createLabel={m.create_button()}
  onCreate={handleCreate}
/>
```

**Props**:
- `data` - Array of items
- `columns` - TanStack column definitions
- `loading` - Show loading state
- `searchPlaceholder`, `emptyMessage`, `loadingMessage` - i18n strings
- `createLabel`, `onCreate` - Create button
- `toolbar` - Custom toolbar snippet (replaces create button)
- `pageSize` - Items per page (default: 10)

**For custom cell rendering**, use `renderSnippet` from `$lib/components/ui/data-table` with Svelte snippets.

### Edit/Update Dialogs with Data Tables (superForm + shadcn Dialog)

When a data table needs an edit action per row, use the **single dialog at page level** pattern. Never instantiate a dialog component per table row.

**Why**: Rendering a dialog+form per row creates N superForm instances, N hidden dialogs in the DOM, and causes HTML `id` collisions on forms. Instead, one dialog instance is mounted at the page level and controlled by state.

**Page (`+page.svelte`)**:
```svelte
<script lang="ts">
  let editingItem = $state<MyType | null>(null);
</script>

{#snippet actionsCell(item: MyType)}
  <Button variant="ghost" size="icon" onclick={() => (editingItem = item)}>
    <PencilIcon />
  </Button>
{/snippet}

<!-- Single dialog instance, outside the table -->
<UpdateItemDialog
  item={editingItem}
  onClose={() => (editingItem = null)}
  onSuccess={reloadData}
/>
```

**Dialog component (`update-item-dialog.svelte`)**:
```svelte
<script lang="ts">
  interface Props {
    item: MyType | null;
    onClose: () => void;
    onSuccess?: () => void;
  }

  const { item, onClose, onSuccess }: Props = $props();
  const open = $derived(item !== null);

  const form = superForm(defaults(zod4(schema)), {
    SPA: true,
    id: 'update-item-form',
    validators: zod4Client(schema),
    onUpdate({ form }) {
      if (!form.valid || !item) return;
      // call API with item.id and form.data, then onClose() + onSuccess()
    }
  });

  const { form: formData, enhance } = form;

  $effect(() => {
    if (item) {
      $formData.name = item.name;
    }
  });
</script>

<Dialog.Root {open} onOpenChange={(v) => { if (!v) { form.reset(); onClose(); } }}>
  <form use:enhance id="update-item-form">
    <Dialog.Content>
      <!-- form fields -->
      <Dialog.Footer>
        <Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
          Cancel
        </Dialog.Close>
        <Button type="submit" form="update-item-form">Save</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </form>
</Dialog.Root>
```

**Key rules**:
- `open` is `$derived` from the prop being non-null (no `bind:open`, no `Dialog.Trigger`)
- Use `onOpenChange` on `Dialog.Root` to centralize close logic (reset + onClose). This handles overlay click, Escape key, and `Dialog.Close` button
- Use `Dialog.Close` for the cancel button, not a `Button` with manual `onClose()`. `Dialog.Close` triggers `onOpenChange(false)` which already handles cleanup, avoiding duplicated logic
- `$effect` syncs form data when `item` changes (each time a different row is selected)
- The action button in the table row only sets state, it does not render a dialog
- Always set an explicit `id` in the superForm options that matches the HTML form's `id` attribute. When multiple superForm instances coexist on the same page (e.g., create + update), superforms uses a default ID internally; without explicit IDs, it warns about duplicate form IDs and forms may conflict
- Use `resetForm: false` in the `superForm` options to prevent the form from clearing its data if a backend mutation fails, so the user doesn't have to retype everything.

### Date Pickers

Never use native `<input type="date">` for date fields. Always use shadcn `Calendar` inside a `Popover`.

**Date format convention**: The backend always sends and receives dates as `DD/MM/YYYY HH:MM:SS` (24-hour clock, Mexico City timezone). Never use `new Date(str)` to parse backend date strings — it interprets `DD/MM` as `MM/DD`. Always use `date-utils` functions.

**Calendar locale**: The Calendar component defaults to `locale="es-MX"` so day/month names display in Spanish and the week starts on Monday, regardless of browser locale.

```svelte
import Calendar from '$lib/components/ui/calendar/calendar.svelte';
import * as Popover from '$lib/components/ui/popover';
import { formatISODate } from 'date-utils';
import { parseDate } from '@internationalized/date';
import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

let fechaInicioOpen = $state(false);
```

**Date field (inside `Form.Control` snippet)**:
```svelte
<Popover.Root bind:open={fechaInicioOpen}>
  <Popover.Trigger>
    {#snippet child({ props: triggerProps })}
      <Button id={props.id} {...triggerProps} variant="outline" class="w-full justify-between font-normal">
        {$formData.fechaInicio
          ? formatISODate($formData.fechaInicio)
          : m.applications_select_date()}
        <ChevronDownIcon />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto overflow-hidden p-0" align="start">
    <Calendar
      type="single"
      value={$formData.fechaInicio ? parseDate($formData.fechaInicio) : undefined}
      onValueChange={(v) => { if (v) { $formData.fechaInicio = v.toString(); fechaInicioOpen = false; } }}
      captionLayout="dropdown"
    />
  </Popover.Content>
</Popover.Root>
```

**Timezone description**: Every date field must include a `Form.Description` with the timezone:
```svelte
<Form.Description>{m.common_timezone_description()}</Form.Description>
```

**Time field**: Use `Input` with `type="time"`. The browser decides whether to show 12h or 24h format based on the user's OS locale, but the HTML value is always stored in 24h format (`HH:MM`). `toBackendDateTime` from `date-utils` automatically appends `:00` seconds when converting to `DD/MM/YYYY HH:MM:SS`. Use these classes to hide the native picker indicator:
```svelte
<Input {...props} type="time" bind:value={$formData.horaInicio}
  class="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" />
```

### Data Loading Pattern (fetchPolicy)

All read methods in `apiService` accept an optional `fetchPolicy` parameter that defaults to `'network-only'`.

**Rule**: use `'cache-first'` in `onMount` to show data instantly from the Apollo cache; call without arguments (defaults to `'network-only'`) in `onSuccess` callbacks after mutations so the table always reflects the latest backend state.

```svelte
<script lang="ts">
  import type { FetchPolicy } from '@apollo/client/core';

  function loadItems(fetchPolicy?: FetchPolicy) {
    loading = true;
    apiService
      .getItems(fetchPolicy)
      .then((res) => (items = res))
      .finally(() => (loading = false));
  }

  onMount(() => {
    loadItems('cache-first'); // show cached data instantly
  });
</script>

<!-- After create / update / delete, always re-fetch from network -->
<CreateItemDialog onSuccess={() => loadItems()} />
<UpdateItemDialog onSuccess={() => loadItems()} />
<DeleteItemDialog onSuccess={() => loadItems()} />
```

**Key rules**:
- `onMount` → `loadSomething('cache-first')` — fast initial render from cache.
- After any mutation (`onCreate`, `onUpdate`, `onDelete`, `onSuccess`) → `loadSomething()` — uses the `'network-only'` default, ensuring fresh data from the backend.
- Never hardcode `'network-only'` in `onSuccess` callbacks; rely on the default in `api.svelte.ts`.
- `getJob` (polling) always uses `'network-only'` internally and does not expose `fetchPolicy`.

### API Error Handling

Use `apiError()` from `$lib/utils/api-error` for all `.catch()` blocks that show user-facing error toasts. Never write inline `.catch(() => toast.error(...))` for API calls.

**Location**: `src/lib/utils/api-error.ts` (exists in `application-manager` and `exam-maker`)

**Shared package**: `packages/api-errors` exports `extractErrorCode(error)` and `VWD_CODES` (error code constants). Add new error codes to `VWD_CODES` as they are discovered.

**Simple usage (generic error toast)**:
```ts
import { apiError } from '$lib/utils/api-error';

try {
  await apiService.deleteItem(id);
  toast.success(m.item_delete_success());
  onClose();
  onSuccess?.();
} catch (error) {
  apiError()(error);
} finally {
  loading = false;
}
```

**With specific error codes**:
```ts
import { apiError } from '$lib/utils/api-error';

try {
  await apiService.deleteReactivo(id);
  // ...
} catch (error) {
  apiError({
    'VWD006': () => ({
      message: m.reactivo_in_use(),
      description: m.reactivo_in_use_description()
    })
  })(error);
} finally {
  loading = false;
}
```

**Key rules**:
- `apiError()` without arguments shows `unexpected_error` + `unexpected_error_description` (must exist in `messages/en.json` and `messages/es.json`)
- `apiError({ 'CODE': () => ({ message, description }) })` maps specific error codes to translated messages. Unmatched codes fall back to the generic message.
- Message resolvers are callbacks (`() => ...`) because Paraglide messages must be evaluated at runtime
- Do NOT use `apiError()` for data-loading `.catch()` blocks that log to console — those should remain as `console.error`
- When adding a new app, create `src/lib/utils/api-error.ts` with the same structure (requires `svelte-sonner` and Paraglide)

### Environment Variables

Required variables in `.env` (see `.env.example`):
```
PUBLIC_AWS_REGION=us-east-1
PUBLIC_COGNITO_CLIENT_ID=your_cognito_client_id
PUBLIC_REQUIRED_GROUP=operators
PUBLIC_APPSYNC_ENDPOINT=https://your-endpoint.appsync-api.region.amazonaws.com/graphql
```

### SP vs TG Database Prefix Convention

GraphQL operations use two prefixes that map to different databases:
- **`sp`** → "supervisor" database (exam proctoring system)
- **`tg`** → "test-guard" database (application management system)

Use the same prefix as the original Angular component used. Never swap `sp` for `tg` or vice versa.

**`sp` jobs differ from `tg` jobs**: `spSaveJob` takes `SPJobSave { idTipo: ID! }` (no `idAplicacion`), while `tgSaveJob` takes `TGJobSave { idAplicacion: ID!, idTipo: ID! }`. Both return `ID!` and poll via their respective `spJob`/`tgJob` queries.

### Dual-list Selection Dialog

For dialogs that assign items to a record (e.g. associating supervisors to an application), use the **dual-list pattern** instead of superForm. No form validation — direct API calls with local state updates.

**Page (`+page.svelte`)**:
```svelte
<script lang="ts">
  let assigningApp = $state<Aplicacion | null>(null);
</script>

{#snippet actionsCell(app: Aplicacion)}
  <Button variant="ghost" size="icon" onclick={() => (assigningApp = app)}>
    <UsersIcon />
  </Button>
{/snippet}

<AssignSupervisorsDialog
  application={assigningApp}
  institutionId={institutionId}
  onClose={() => (assigningApp = null)}
/>
```

**Dialog component (`assign-supervisors-dialog.svelte`)**:
```svelte
<script lang="ts">
  interface Props {
    application: Aplicacion | null;
    institutionId: string;
    onClose: () => void;
  }

  const { application, institutionId, onClose }: Props = $props();
  const open = $derived(application !== null);

  let available = $state<Supervisor[]>([]);
  let assigned = $state<Supervisor[]>([]);
  let loading = $state(false);

  $effect(() => {
    if (application) {
      loading = true;
      Promise.all([
        apiService.getSupervisoresByInstitucion(institutionId),
        apiService.getSupervisoresByAplicacion({ idAplicacion: application.id, incluyeNoAsociados: false })
      ]).then(([all, linked]) => {
        const linkedIds = new Set(linked.map((s) => s.id));
        assigned = linked;
        available = all.filter((s) => !linkedIds.has(s.id));
      }).finally(() => (loading = false));
    }
  });

  async function add(supervisor: Supervisor) {
    available = available.filter((s) => s.id !== supervisor.id);
    assigned = [...assigned, supervisor];
    await apiService.saveSupervisorAplicacion({ idSupervisor: supervisor.id, idAplicacion: application!.id });
  }

  async function remove(supervisor: Supervisor) {
    assigned = assigned.filter((s) => s.id !== supervisor.id);
    available = [...available, supervisor];
    await apiService.deleteSupervisorAplicacion(supervisor.id, application!.id);
  }
</script>

<Dialog.Root {open} onOpenChange={(v) => { if (!v) onClose(); }}>
  <Dialog.Content class="max-w-2xl">
    <!-- Two-column layout: available (left) | assigned (right) -->
    <!-- Each supervisor card has an add/remove button -->
  </Dialog.Content>
</Dialog.Root>
```

**Key rules**:
- `open` is `$derived` from the prop being non-null (same as update dialogs)
- No `form.reset()` needed on close — state resets via `$effect` when `application` changes
- Optimistic UI: update local arrays immediately, then call the API
- Do not use `onOpenChange` to reset state; the `$effect` re-runs when a new item is selected

## Documentation

Developer documentation lives in `docs/` as bilingual Typst files compiled to PDF:

```
docs/
├── english/README.typ   → English entrypoint (compile with --root .)
├── spanish/README.typ   → Spanish entrypoint (compile with --root .)
├── english/shared/      → Shared chapters (architecture, auth, data layer, etc.)
├── spanish/shared/      → Spanish translations of shared chapters
├── english/<app>/       → Per-app chapters (application-manager, exam-maker, etc.)
└── spanish/<app>/       → Spanish translations of per-app chapters
```

**Update workflow**: See `.agent/workflows/update-docs.md` for the full procedure on how to scan, update, and compile docs.

**Key rules**:
- File structure diagrams use **CeTZ** (never ASCII `├──` trees)
- Every change must be applied to **both** English and Spanish
- Code examples stay in English; only prose/labels/headings are translated
- `CLAUDE.md` is auto-embedded in the appendix via `cmarker` at compile time
- Use `#claude-box("Section Name")` to inline-embed a specific CLAUDE.md section in a chapter

