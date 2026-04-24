# Catalog Import — El hilvan

Tooling to digitize paper price sheets into the catalog-service.

---

## Strategy: Flyway migrations (primary)

All catalog seed data lives in versioned Flyway SQL files under:

```
anotame-api/backend/catalog-service/src/main/resources/db/migration/
  V1__baseline.sql          ← schema only (tables)
  V2__seed_catalog_es.sql   ← initial Spanish catalog (types + services)
  V3__...                   ← real business prices (add when ready)
```

When the service deploys, Flyway runs new migrations automatically. **No manual API calls or scripts needed** — just add a new `V3__...sql` file and redeploy.

### Why Flyway instead of an API import script?

- Every data change is version-controlled and auditable.
- Prod and staging stay in sync automatically on deploy.
- No credentials or running service needed to apply data — it runs at startup.
- Migrations are idempotent at the version level (Flyway tracks what has run).

---

## Adding real business data (V3)

When you have the AI-extracted CSV from the paper sheets:

1. Paste the rows into `services.csv` (columns: `tipo_prenda,nombre,descripcion,duracion_min,precio_base`).
2. Run the helper script to generate the SQL:
   ```bash
   node csv-to-migration.js --version 3 --description "precios_negocio"
   # → creates V3__precios_negocio.sql
   ```
3. Copy the file to `src/main/resources/db/migration/`.
4. Redeploy — Flyway picks it up on startup.

---

## AI extraction prompt (Spanish)

Use this prompt when photographing the paper sheets with Claude or any vision AI:

```
Extrae los servicios y precios de esta lista en una tabla CSV con exactamente estas columnas:
tipo_prenda,nombre,descripcion,duracion_min,precio_base

Reglas:
- tipo_prenda: categoría de la prenda (Pantalón, Camisa, Chamarra, Vestido, Falda, Traje, u Otro)
- nombre: nombre del servicio
- descripcion: descripción breve de lo que incluye el servicio (inventa una si no aparece)
- duracion_min: minutos estimados (si no se muestra: Ruedo=15, Cambio de botón=5, Cambio de cierre=45, etc.)
- precio_base: precio en MXN como decimal (p.ej. 12.00)

Devuelve solo las filas CSV, sin explicación.
```

Paste the output into `services.csv`, then generate the migration with the script above.

---

## CSV reference

### `garments.csv` — clothing types (pre-filled, edit if needed)

| Column | Required | Notes |
|--------|----------|-------|
| `name` | yes | Nombre del tipo de prenda |
| `description` | no | Descripción corta |

### `services.csv` columns

| Column | Required | Notes |
|--------|----------|-------|
| `tipo_prenda` | yes | Debe coincidir con un nombre en `garments.csv` |
| `nombre` | yes | Nombre del servicio |
| `descripcion` | no | Qué incluye el servicio |
| `duracion_min` | yes | Minutos estimados |
| `precio_base` | yes | Precio en MXN (p.ej. `12.00`) |

### `price-list.csv` — optional date-range overrides

Only needed for seasonal pricing or promotions. Leave empty if using base prices.

| Column | Notes |
|--------|-------|
| `list_name` | Nombre de la lista de precios |
| `valid_from` | ISO datetime e.g. `2026-06-01T00:00:00` |
| `valid_to` | ISO datetime or empty for open-ended |
| `priority` | Higher number wins over lower |
| `tipo_prenda` | For reference only |
| `nombre_servicio` | Must match `services.csv` exactly |
| `precio_override` | Price in MXN |

---

## API import script (fallback)

`import.js` is kept as a fallback for one-off loads to a running environment without redeploy access.

```bash
# dry run first
node import.js --env local --username admin --password secret --dry-run

# apply
node import.js --env prod --username admin --password yourprodpassword
```

Set `IDENTITY_URL` and `CATALOG_URL` env vars for prod.

---

## Known limitations / deferred

- **Near-duplicate detection** ("Ruedo" vs "Ruedo de pantalón") — deferred to a data-quality milestone.
- **Bulk price updates** on existing rows — not supported yet.
