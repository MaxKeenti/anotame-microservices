# Catalog Import — El hilvan

A zero-dependency Node.js script that digitizes price sheets into the catalog-service.

---

## The Problem

You have a folder of paper sheets with El hilvan's services and prices. Typing everything by hand into the app UI would take hours and is error-prone. This toolset solves it in three steps:

1. **Photograph → extract** (AI-assisted OCR, see below)
2. **Review the CSV** (spot errors, handle duplicates — in a spreadsheet if you prefer)
3. **Run the import script** — it calls the API, skips existing entries, and reports what it created

---

## Step 1: Digitize the Paper Sheets (AI OCR)

You do not need to type anything manually. Use AI vision to convert photos of the sheets into CSV rows.

### Option A — Claude (recommended, free to use)

1. Open [claude.ai](https://claude.ai) in your browser.
2. Attach a photo of each price sheet (drag & drop).
3. Send this prompt:

```
Extract the services and prices from this price list into a CSV table with these exact columns:
garment_type,name,description,duration_min,base_price

Rules:
- garment_type: the clothing category (Pants, Shirt, Jacket, Dress, Skirt, Suit, or Other)
- name: the service name
- description: brief description of what the service is (invent one if not on the paper)
- duration_min: estimated minutes to complete (guess if not shown: Hemming=15, Button=5, Zipper=45, etc.)
- base_price: price in MXN as a decimal number (e.g. 12.00)

Output only the CSV rows, no explanation.
```

4. Copy the output into `services.csv`.
5. Repeat for each sheet.

### Option B — Google Lens / Drive OCR

1. Upload photos to Google Drive.
2. Right-click → Open with Google Docs (it auto-runs OCR).
3. Copy the extracted text into a spreadsheet and clean it up manually.
4. Export as CSV.

---

## Step 2: Fill the CSVs

Three files live in this directory:

| File | What it contains |
|------|-----------------|
| `garments.csv` | Clothing types (Pants, Shirt, etc.) — pre-filled with defaults |
| `services.csv` | All services with base price — **edit this one with your data** |
| `price-list.csv` | Optional price overrides for a date range (e.g. holiday promos) |

### `garments.csv` columns

| Column | Required | Notes |
|--------|----------|-------|
| `name` | yes | Clothing type name |
| `description` | no | Short description |

### `services.csv` columns

| Column | Required | Notes |
|--------|----------|-------|
| `garment_type` | yes | Must match a name in `garments.csv` (or already in prod) |
| `name` | yes | Service name |
| `description` | no | What the service does |
| `duration_min` | yes | Estimated minutes |
| `base_price` | yes | Price in MXN (e.g. `12.00`) |

### `price-list.csv` columns (optional)

Only fill this if you want override pricing for a specific date range.

| Column | Notes |
|--------|-------|
| `list_name` | Name for this price list |
| `valid_from` | ISO datetime e.g. `2026-06-01T00:00:00` |
| `valid_to` | ISO datetime or leave empty for open-ended |
| `priority` | Higher number wins over lower |
| `garment_type` | For reference only (not sent to API) |
| `service_name` | Must match a name in `services.csv` exactly |
| `override_price` | Price in MXN |

---

## Step 3: Run the Import

### Prerequisites

- Node.js 18+ installed
- The catalog-service must be running (locally or on Railway)

### Local environment

```bash
cd scripts/catalog-import
node import.js --env local --username admin --password secret
```

### Production (Railway)

First, set the Railway service URLs:

```bash
export IDENTITY_URL=https://your-identity-service.up.railway.app
export CATALOG_URL=https://your-catalog-service.up.railway.app

node import.js --env prod --username admin --password yourprodpassword
```

### Dry run (no changes made)

Always run with `--dry-run` first to verify what would be created:

```bash
node import.js --env local --username admin --password secret --dry-run
```

---

## Behavior

- **Dedup by name**: garments and services that already exist in the database are skipped (case-insensitive). Safe to re-run.
- **Unknown garment type**: if a service references a garment type not found in the database, it imports without a garment type and logs a warning.
- **Errors**: individual row errors are logged but do not abort the whole import.

---

## Known Limitations / Deferred

- **Duplicate detection** for near-matches (e.g. "Hemming" vs "Hem") is not implemented — that's a data quality milestone for later. The script only skips exact name matches (case-insensitive).
- **Bulk updates** (updating existing service prices) are not supported yet — the script only creates new entries.
- **CSV format**: fields containing commas must be wrapped in double quotes: `"Jacket, Blazer"`.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Login succeeded but no cookie returned` | Auth service unreachable or wrong URL | Check `--env` and that identity-service is running |
| `POST /catalog/services → 401` | JWT expired or wrong credentials | Re-run the script (it re-logs in each time) |
| `garment type "X" not found` | Typo in `garment_type` column | Match exactly what's in `garments.csv` |
| `ECONNREFUSED` | Service is not running | Start with `docker compose up -d && ./dev.sh` |
