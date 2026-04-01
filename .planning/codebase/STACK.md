# Technology Stack

**Analysis Date:** 2026-03-31

---

## Languages

| Language | Version | Where Used |
|----------|---------|------------|
| Java | 21 (identity, catalog, operations) / 17 (sales) | All backend microservices |
| TypeScript | ^5.9.3 | SvelteKit frontend (`anotame-web/`) |
| SQL | PostgreSQL dialect | Database init script (`anotame-db/init.sql`) |

> **Note:** The parent POM (`anotame-api/backend/pom.xml`) declares `java.version=17` as the shared property, but individual service POMs override with `maven.compiler.release=21` for identity, catalog, and operations. Sales uses `maven.compiler.release=17`. This is an inconsistency to be aware of.

---

## Runtime

| Component | Runtime | Version |
|-----------|---------|---------|
| Backend services | JVM (eclipse-temurin) | 21-jre-alpine (Docker) |
| Frontend | Bun | `oven/bun:latest` (Docker) |
| Database | PostgreSQL | 16-alpine |

**Build-time runtime:** `maven:3.9.6-eclipse-temurin-21-alpine` — used in all backend Dockerfiles as the build stage image.

---

## Package Managers

| Layer | Manager | Lockfile |
|-------|---------|---------|
| Backend | Maven 3.9.6 | `pom.xml` files |
| Frontend | Bun | `bun.lock` (present — `--frozen-lockfile` enforced in Dockerfile) |

---

## Frameworks

### Backend — Quarkus 3.27.2

All four microservices use **Quarkus 3.27.2** (not Spring Boot, despite the parent POM inheriting from `spring-boot-starter-parent 3.2.3` — the parent POM is a legacy artifact not used by individual service builds).

Each service declares its own `dependencyManagement` block importing `io.quarkus.platform:quarkus-bom:3.27.2`.

| Extension | Purpose |
|-----------|---------|
| `quarkus-rest-jackson` | JAX-RS REST endpoints with Jackson JSON serialization |
| `quarkus-hibernate-orm-panache` | ORM — Panache active-record + repository pattern |
| `quarkus-jdbc-postgresql` | PostgreSQL JDBC driver |
| `quarkus-hibernate-validator` | Bean Validation (JSR-380) via Hibernate Validator |
| `quarkus-smallrye-jwt` | MicroProfile JWT — sign (identity) + verify (all services) |
| `quarkus-elytron-security-common` | Security support (identity-service only) |
| `quarkus-arc` | CDI dependency injection (operations-service explicit) |
| `quarkus-maven-plugin` | Build, code generation, native packaging |

**Lombok** is used across all services (`1.18.30`–`1.18.36`) as a `provided`/annotation-processor dependency.

### Frontend — SvelteKit 2 + Svelte 5

| Package | Version | Role |
|---------|---------|------|
| `svelte` | ^5.51.0 | UI framework (Svelte 5 Runes mode) |
| `@sveltejs/kit` | ^2.50.2 | Full-stack web framework |
| `@sveltejs/adapter-node` | ^5.5.4 | Node.js SSR adapter (used in production) |
| `@sveltejs/vite-plugin-svelte` | ^6.2.4 | Vite integration |

**Runes mode** is enforced for all non-`node_modules` files via `svelte.config.js`:
```js
vitePlugin: {
  dynamicCompileOptions: ({ filename }) =>
    filename.includes('node_modules') ? undefined : { runes: true }
}
```

---

## UI Libraries (Frontend)

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.1.18 | Utility-first CSS (v4 — Vite plugin, no `tailwind.config.js`) |
| `@tailwindcss/vite` | ^4.1.18 | Tailwind v4 Vite integration |
| `bits-ui` | ^2.16.3 | Headless UI primitives (replaces shadcn-svelte primitives) |
| `@lucide/svelte` | ^0.577.0 | Icon set (dev) |
| `lucide-svelte` | ^0.577.0 | Icon set (runtime) |
| `clsx` | ^2.1.1 | Conditional class names |
| `tailwind-merge` | ^3.5.0 | Merge Tailwind classes without conflicts |
| `tailwind-variants` | ^3.2.2 | Variant-based component styling |
| `tw-animate-css` | ^1.4.0 | Animation utilities |
| `mode-watcher` | ^1.1.0 | Dark/light mode management |
| `svelte-sonner` | ^1.1.0 | Toast notifications |
| `@fontsource-variable/inter` | ^5.2.8 | Inter variable font |

---

## Form Handling & Validation (Frontend)

| Package | Version | Purpose |
|---------|---------|---------|
| `sveltekit-superforms` | ^2.30.0 | Type-safe form handling with SvelteKit actions |
| `formsnap` | ^2.0.1 | Form accessibility bindings for superforms |
| `zod` | ^4.3.6 | Schema validation (frontend + shared with superforms) |
| `@internationalized/date` | ^3.12.0 | Date/time object handling (calendar pickers) |

---

## Data & State Management (Frontend)

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/table-core` | ^8.21.3 | Headless table logic |
| `runed` | ^0.37.1 | Svelte 5 utilities, including `PersistedState` (used for auth state in localStorage) |

---

## Internationalization (Frontend)

| Package | Version | Purpose |
|---------|---------|---------|
| `@inlang/paraglide-js` | ^2.15.1 | Compile-time i18n message catalog |
| `@inlang/paraglide-sveltekit` | ^0.16.1 | SvelteKit adapter for Paraglide |

---

## Build Tooling

### Backend

| Tool | Version | Config File |
|------|---------|-------------|
| Maven | 3.9.6 | `anotame-api/backend/pom.xml` (parent), per-service `pom.xml` |
| maven-compiler-plugin | 3.13.0 | Inline in each service POM |
| maven-surefire-plugin | 3.5.2 | Inline in each service POM |
| quarkus-maven-plugin | 3.27.2 | Drives build, code gen, and packaging |

Build output: `target/quarkus-app/quarkus-run.jar` (fast-jar format).

### Frontend

| Tool | Version | Config File |
|------|---------|-------------|
| Vite | ^7.3.1 | `anotame-web/vite.config.*` (implied, not separately found) |
| TypeScript | ^5.9.3 | `anotame-web/tsconfig.json` |
| svelte-check | ^4.4.2 | Type-checking — `bun run check` |

---

## Database

| Component | Details |
|-----------|---------|
| Engine | PostgreSQL 16-alpine |
| Extensions | `pgcrypto` (UUID generation via `gen_random_uuid()`), `citext` (case-insensitive text) |
| Schema init | `anotame-db/init.sql` — mounted at `/docker-entrypoint-initdb.d/init.sql` |
| GUI | pgAdmin 4 v8 (optional, port `5050`) |
| Data volume | `postgres_data` (named Docker volume) |
| Exposed port | `5433` (host) → `5432` (container) |

**No PostGIS detected** in the current `init.sql` extensions — only `pgcrypto` and `citext` are enabled.

### Schema Design

The schema uses domain-prefixed table naming:

| Prefix | Domain |
|--------|--------|
| `cca_` | Catalog config/admin (e.g., `cca_role`) |
| `cci_` | Catalog items (e.g., `cci_garment_type`, `cci_service`) |
| `tcc_` | Catalog transactions (e.g., `tcc_price_list`) |
| `tca_` | Identity/auth (users) |
| `tco_` | Sales orders |
| `tce_` | Operations/establishments |

All tables use `UUID` primary keys (via `gen_random_uuid()`), soft deletes (`deleted_at TIMESTAMPTZ`, `is_deleted BOOLEAN`), and audit timestamps (`created_at`, `updated_at`).

---

## Containerization

All services are Docker-containerized with multi-stage builds.

### Backend Dockerfile Pattern

```
Stage 1: maven:3.9.6-eclipse-temurin-21-alpine
  - Copy parent pom.xml + all module pom.xml files
  - Download dependencies offline
  - Copy service source
  - mvn clean package -pl <service> -am -DskipTests

Stage 2: eclipse-temurin:21-jre-alpine
  - Copy target/quarkus-app/ from build stage
  - ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
```

Reference: `anotame-api/backend/identity-service/Dockerfile`, `catalog-service/Dockerfile`, etc.

### Frontend Dockerfile Pattern

```
Stage 1: oven/bun:latest
  - bun install --frozen-lockfile
  - Inject PUBLIC_*_URL build args as ENV vars
  - bun run build

Stage 2: oven/bun:latest
  - Copy build/ and node_modules/
  - CMD ["bun", "./build/index.js"]
```

Reference: `anotame-web/Dockerfile`

---

## Configuration

### Backend Configuration Pattern

Each service uses `src/main/resources/application.properties`. Quarkus supports environment variable overrides using the `QUARKUS_` prefix convention.

Key env vars for backend services (from `.env.example`):
- `QUARKUS_DATASOURCE_JDBC_URL` — PostgreSQL JDBC URL
- `QUARKUS_DATASOURCE_USERNAME` — DB username
- `QUARKUS_DATASOURCE_PASSWORD` — DB password

### Frontend Configuration Pattern

SvelteKit `$env/dynamic/public` is used at runtime. Build-time injection uses Docker `ARG` → `ENV`:
- `PUBLIC_IDENTITY_URL`
- `PUBLIC_CATALOG_URL`
- `PUBLIC_SALES_URL`
- `PUBLIC_OPERATIONS_URL`

**Note:** `.env.example` still references `NEXT_PUBLIC_*` variable names (leftover from a Next.js migration), but the actual Dockerfile and SvelteKit code use `PUBLIC_*` names.

---

## Platform Requirements

**Development:**
- Docker + Docker Compose
- Java 21 JDK (for local backend development without Docker)
- Bun (for local frontend development)
- Maven 3.9.6+

**Production Target:**
- Railway (evidenced by CORS allow-list: `https://anotame-microservices-production.up.railway.app`, and `.env.example` Railway deployment notes)
- Each service deployed as a separate Railway service
- Shared PostgreSQL instance (Railway managed or self-hosted)

---

*Stack analysis: 2026-03-31*
