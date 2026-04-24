#!/usr/bin/env node
/**
 * Catalog import script for El hilvan.
 *
 * Reads garments.csv, services.csv, and optionally price-list.csv,
 * then loads them into the catalog-service via its REST API.
 *
 * Auth: logs in via identity-service, uses the returned jwt cookie.
 * Dedup: skips garments/services that already exist by name (case-insensitive).
 *
 * Usage:
 *   node import.js --env prod --username admin --password secret
 *   node import.js --env local --username admin --password secret
 *   node import.js --help
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: node import.js [options]

Options:
  --env <local|prod>     Target environment (default: local)
  --username <name>      Admin username (required)
  --password <pass>      Admin password (required)
  --dry-run              Print what would be sent without making API calls
  --help                 Show this message

Environment endpoints:
  local  identity: http://localhost:8081
         catalog:  http://localhost:8082
  prod   Set IDENTITY_URL and CATALOG_URL env vars, or edit ENDPOINTS below.
`);
  process.exit(0);
}

function flag(name) {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
}

const ENV = flag("--env") ?? "local";
const USERNAME = flag("--username");
const PASSWORD = flag("--password");
const DRY_RUN = args.includes("--dry-run");

if (!USERNAME || !PASSWORD) {
  console.error("Error: --username and --password are required.");
  process.exit(1);
}

const ENDPOINTS = {
  local: {
    identity: "http://localhost:8081",
    catalog: "http://localhost:8082",
  },
  prod: {
    identity: process.env.IDENTITY_URL ?? "https://your-identity-service.up.railway.app",
    catalog: process.env.CATALOG_URL ?? "https://your-catalog-service.up.railway.app",
  },
};

if (!ENDPOINTS[ENV]) {
  console.error(`Unknown env "${ENV}". Use "local" or "prod".`);
  process.exit(1);
}

const { identity: IDENTITY_BASE, catalog: CATALOG_BASE } = ENDPOINTS[ENV];
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CSV parser (no external deps)
// ---------------------------------------------------------------------------
function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()]));
  });
}

function splitCsvLine(line) {
  // Handles quoted fields with commas inside them.
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
async function post(url, body, cookie) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} → ${res.status}: ${text}`);
  }
  return res;
}

async function get(url, cookie) {
  const headers = {};
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function login() {
  console.log(`\n[auth] Logging in as "${USERNAME}" on ${IDENTITY_BASE}...`);
  const res = await post(`${IDENTITY_BASE}/auth/login`, {
    username: USERNAME,
    password: PASSWORD,
  });

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Login succeeded but no cookie returned.");

  // Extract: jwt=<token>; Path=/; ...
  const match = setCookie.match(/jwt=([^;]+)/);
  if (!match) throw new Error(`Could not parse jwt from set-cookie: ${setCookie}`);

  console.log("[auth] Login OK.");
  return `jwt=${match[1]}`;
}

// ---------------------------------------------------------------------------
// Garments
// ---------------------------------------------------------------------------
async function importGarments(cookie) {
  const rows = parseCsv(path.join(__dirname, "garments.csv"));
  if (rows.length === 0) {
    console.log("[garments] garments.csv is empty — skipping.");
    return {};
  }

  console.log(`\n[garments] Loading ${rows.length} rows from garments.csv...`);

  // Fetch existing garments to dedup by name
  const existing = await get(`${CATALOG_BASE}/catalog/garments`, cookie);
  const existingByName = Object.fromEntries(
    existing.map((g) => [g.name.toLowerCase(), g])
  );

  const nameToId = {};
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (existingByName[key]) {
      console.log(`  skip  "${name}" (already exists)`);
      nameToId[name] = existingByName[key].id;
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  dry   POST /catalog/garments { name: "${name}", description: "${row.description}" }`);
      nameToId[name] = `dry-run-id-${name}`;
      created++;
      continue;
    }

    const res = await post(`${CATALOG_BASE}/catalog/garments`, {
      name,
      description: row.description ?? "",
    }, cookie);

    const created_garment = await res.json();
    nameToId[name] = created_garment.id;
    console.log(`  create "${name}" → ${created_garment.id}`);
    created++;
  }

  console.log(`[garments] Done: ${created} created, ${skipped} skipped.`);
  return nameToId;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
async function importServices(cookie, garmentNameToId) {
  const rows = parseCsv(path.join(__dirname, "services.csv"));
  if (rows.length === 0) {
    console.log("[services] services.csv is empty — skipping.");
    return {};
  }

  console.log(`\n[services] Loading ${rows.length} rows from services.csv...`);

  const existing = await get(`${CATALOG_BASE}/catalog/services`, cookie);
  const existingByName = Object.fromEntries(
    existing.map((s) => [s.name.toLowerCase(), s])
  );

  const nameToId = {};
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    const garmentTypeName = row.garment_type?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (existingByName[key]) {
      console.log(`  skip  "${name}" (already exists)`);
      nameToId[name] = existingByName[key].id;
      skipped++;
      continue;
    }

    const garmentTypeId = garmentNameToId[garmentTypeName];
    if (garmentTypeName && !garmentTypeId) {
      console.warn(`  warn  "${name}" — garment type "${garmentTypeName}" not found, importing without it`);
    }

    const payload = {
      name,
      description: row.description ?? "",
      defaultDurationMin: parseInt(row.duration_min, 10) || 30,
      basePrice: parseFloat(row.base_price) || 0,
      garmentTypeId: garmentTypeId ?? null,
    };

    if (DRY_RUN) {
      console.log(`  dry   POST /catalog/services ${JSON.stringify(payload)}`);
      nameToId[name] = `dry-run-id-${name}`;
      created++;
      continue;
    }

    try {
      const res = await post(`${CATALOG_BASE}/catalog/services`, payload, cookie);
      const created_service = await res.json();
      nameToId[name] = created_service.id;
      console.log(`  create "${name}" → ${created_service.id}`);
      created++;
    } catch (err) {
      console.error(`  error  "${name}": ${err.message}`);
      errors++;
    }
  }

  console.log(`[services] Done: ${created} created, ${skipped} skipped, ${errors} errors.`);
  return nameToId;
}

// ---------------------------------------------------------------------------
// Price list (optional)
// ---------------------------------------------------------------------------
async function importPriceList(cookie, garmentNameToId, serviceNameToId) {
  const csvPath = path.join(__dirname, "price-list.csv");
  const rows = parseCsv(csvPath);

  if (rows.length === 0) {
    console.log("\n[price-list] No price-list rows found — skipping.");
    return;
  }

  // Group rows by list_name
  const lists = {};
  for (const row of rows) {
    const listName = row.list_name?.trim();
    if (!listName) continue;
    if (!lists[listName]) {
      lists[listName] = {
        name: listName,
        validFrom: row.valid_from?.trim(),
        validTo: row.valid_to?.trim() || null,
        priority: parseInt(row.priority, 10) || 0,
        items: [],
      };
    }
    const serviceId = serviceNameToId[row.service_name?.trim()];
    if (!serviceId) {
      console.warn(`  warn  price-list: service "${row.service_name}" not found — skipping item`);
      continue;
    }
    lists[listName].items.push({
      serviceId,
      price: parseFloat(row.override_price) || 0,
    });
  }

  console.log(`\n[price-list] Creating ${Object.keys(lists).length} price list(s)...`);

  for (const [listName, list] of Object.entries(lists)) {
    const payload = {
      name: list.name,
      validFrom: list.validFrom,
      validTo: list.validTo ?? undefined,
      active: true,
      priority: list.priority,
      items: list.items,
    };

    if (DRY_RUN) {
      console.log(`  dry   POST /pricelists ${JSON.stringify(payload, null, 2)}`);
      continue;
    }

    try {
      const res = await post(`${CATALOG_BASE}/pricelists`, payload, cookie);
      const created = await res.json();
      console.log(`  create "${listName}" with ${list.items.length} items → ${created.id}`);
    } catch (err) {
      console.error(`  error  "${listName}": ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Anotame Catalog Import ===");
  console.log(`  env:     ${ENV}`);
  console.log(`  dry-run: ${DRY_RUN}`);

  if (DRY_RUN) {
    console.log("\n[dry-run] No API calls will be made.\n");
  }

  let cookie;
  if (!DRY_RUN) {
    cookie = await login();
  } else {
    cookie = "dry-run-cookie";
  }

  const garmentNameToId = await importGarments(cookie);
  const serviceNameToId = await importServices(cookie, garmentNameToId);
  await importPriceList(cookie, garmentNameToId, serviceNameToId);

  console.log("\n=== Import complete ===");
}

main().catch((err) => {
  console.error("\n[fatal]", err.message);
  process.exit(1);
});
