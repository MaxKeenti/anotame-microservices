#!/usr/bin/env python3
"""Normalize consolidated_services_filled.csv and emit a V4 catalog migration.

Reads:  scripts/data-migration/consolidated_services_filled.csv
Reads:  V2__full_catalog_import.sql (to compute net-new vs already-imported services)

Writes:
  scripts/data-migration/consolidated_services_normalized.csv
  scripts/data-migration/services_missing_price.csv
  anotame-api/backend/catalog-service/src/main/resources/db/migration/V4__complement_catalog_services.sql
"""
from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_IN = ROOT / "scripts/data-migration/consolidated_services_filled.csv"
V2_SQL = ROOT / "anotame-api/backend/catalog-service/src/main/resources/db/migration/V2__full_catalog_import.sql"
CSV_OUT = ROOT / "scripts/data-migration/consolidated_services_normalized.csv"
CSV_NOPRICE = ROOT / "scripts/data-migration/services_missing_price.csv"
V4_OUT = ROOT / "anotame-api/backend/catalog-service/src/main/resources/db/migration/V4__complement_catalog_services.sql"

# Lowercase CSV value -> canonical garment_type name in DB (matches V2).
# 'playera/blusa' is split: each such source row emits TWO rows, one per type,
# so the same alteration is offered against both garments.
GARMENT_MAP = {
    "pantalón":      "Pantalón",
    "camisa":        "Camisa",
    "chamarra":      "Chamarra",
    "vestido":       "Vestido",
    "falda":         "Falda",
    "blusa":         "Blusa",
    "suéter":        "Suéter",
    "sueter":        "Suéter",
    "pans":          "Pans",
    "saco":          "Saco",
    "playera":       "Playera",
    "short":         "Short",
    "licras":        "Licras",
    "abrigo":        "Abrigo",
    "faja":          "Faja",
    "corbata":       "Corbata",
    "cojín":         "Cojín",
    "bolsa":         "Bolsa",
    "toalla":        "Toalla",
    "mantel":        "Mantel",
    "varios":        "Varios",
    "sábanas":       "Sábanas",
    "peluche":       "Peluche",
    "tapete":        "Tapete",
    "cortina":       "Cortina",
    "cobija":        "Cobija",
    "calcetines":    "Calcetines",
    "ropa interior": "Ropa Interior",
}

# (regex, replacement) — applied to both name and description.
TYPO_FIXES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bhombors\b",  re.IGNORECASE), "hombros"),
    (re.compile(r"\bflaso\b",    re.IGNORECASE), "falso"),
    (re.compile(r"\bmaquina\b",  re.IGNORECASE), "máquina"),
    (re.compile(r"\bmagas\b",    re.IGNORECASE), "mangas"),
    (re.compile(r"\bmargas\b",   re.IGNORECASE), "mangas"),
    (re.compile(r"\bplastico\b", re.IGNORECASE), "plástico"),
    (re.compile(r"\belastico\b", re.IGNORECASE), "elástico"),
    (re.compile(r"\bpresion\b",  re.IGNORECASE), "presión"),
    (re.compile(r"\bboton\b",    re.IGNORECASE), "botón"),
]

def load_price_overrides() -> dict[tuple[str, str], tuple[str, str]]:
    """Read filled prices from services_missing_price.csv, keyed by (garment, name).

    The user fills this file by hand once business confirms prices. Values are
    already normalized (canonical garment_type + fixed typos), so we key directly.
    Returns: { (garment_type, name): (duration_min, base_price) }
    """
    if not CSV_NOPRICE.exists():
        return {}
    overrides: dict[tuple[str, str], tuple[str, str]] = {}
    with CSV_NOPRICE.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            price = (r.get("base_price") or "").strip()
            if not price:
                continue
            garment = (r.get("garment_type") or "").strip()
            name = fix_text(r.get("name") or "")
            duration = (r.get("duration_min") or "").strip() or "30"
            overrides[(garment, name)] = (duration, price)
    return overrides

def fix_text(s: str) -> str:
    s = " ".join(s.split())  # collapse whitespace, strip
    for pat, repl in TYPO_FIXES:
        s = pat.sub(repl, s)
    return s

def sql_escape(s: str) -> str:
    return s.replace("'", "''")

def parse_v2_existing() -> set[tuple[str, str]]:
    """Return the (service_name, garment_type) tuples already inserted by V2."""
    text = V2_SQL.read_text(encoding="utf-8")
    existing: set[tuple[str, str]] = set()
    pattern = re.compile(
        r"\(\s*'((?:[^']|'')+)'\s*,\s*'(?:[^']|'')*'\s*,\s*\d+\s*,\s*[\d.]+\s*,"
        r"\s*\(SELECT id_garment_type FROM cci_garment_type WHERE name = '([^']+)'\)"
    )
    for name, garment in pattern.findall(text):
        existing.add((name.replace("''", "'"), garment))
    return existing

def main() -> None:
    rows: list[dict[str, str]] = []
    missing_price: list[dict[str, str]] = []
    unknown_garment: list[str] = []
    price_overrides = load_price_overrides()
    overrides_applied = 0

    with CSV_IN.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            gt_raw = (raw["garment_type"] or "").strip().lower()
            if gt_raw == "playera/blusa":
                garments = ["Playera", "Blusa"]
            else:
                mapped = GARMENT_MAP.get(gt_raw)
                if not mapped:
                    unknown_garment.append(gt_raw)
                    continue
                garments = [mapped]

            name = fix_text(raw["name"] or "")
            desc = fix_text(raw["description"] or "")
            duration = (raw["duration_min"] or "").strip() or "30"
            price = (raw["base_price"] or "").strip()

            for garment in garments:
                row_duration = duration
                row_price = price
                if not row_price:
                    override = price_overrides.get((garment, name))
                    if override:
                        row_duration, row_price = override
                        overrides_applied += 1
                row = {
                    "garment_type": garment,
                    "name": name,
                    "description": desc,
                    "duration_min": row_duration,
                    "base_price": row_price,
                }
                if not row_price:
                    missing_price.append(row)
                else:
                    rows.append(row)

    # Dedupe (garment, name) — keep first occurrence within file.
    seen: set[tuple[str, str]] = set()
    deduped: list[dict[str, str]] = []
    for r in rows:
        key = (r["garment_type"], r["name"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    # Write normalized CSV (priced + unpriced together for transparency).
    fieldnames = ["garment_type", "name", "description", "duration_min", "base_price"]
    with CSV_OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in deduped:
            w.writerow(r)
        for r in missing_price:
            w.writerow(r)

    with CSV_NOPRICE.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in missing_price:
            w.writerow(r)

    # Net-new vs V2.
    existing = parse_v2_existing()
    net_new = [r for r in deduped if (r["name"], r["garment_type"]) not in existing]

    # Build V4 migration.
    header = f"""-- V4__complement_catalog_services.sql
-- Complements V2 catalog with additional services from the consolidated
-- price sheet (scripts/data-migration/consolidated_services_filled.csv).
--
-- Source rows total:        {sum(1 for _ in CSV_IN.open(encoding='utf-8')) - 1}
-- After normalization:      {len(deduped)} priced + {len(missing_price)} unpriced
-- Already in V2:            {len(deduped) - len(net_new)}
-- Net-new in this migration: {len(net_new)}
--
-- Idempotent: ON CONFLICT (name, id_garment_type) DO NOTHING relies on the
-- composite unique constraint added by V2. Re-running this migration is safe.
--
-- Unpriced rows (~{len(missing_price)}) are intentionally excluded — see
-- scripts/data-migration/services_missing_price.csv. Add them in a follow-up
-- migration once prices are confirmed by the business.

BEGIN;

INSERT INTO cci_service (name, description, default_duration_min, base_price, id_garment_type, is_active) VALUES
"""

    values_lines: list[str] = []
    by_garment: dict[str, list[dict[str, str]]] = {}
    for r in net_new:
        by_garment.setdefault(r["garment_type"], []).append(r)

    for garment in sorted(by_garment):
        values_lines.append(f"    -- {garment}")
        for r in by_garment[garment]:
            name = sql_escape(r["name"])
            desc = sql_escape(r["description"])
            duration = int(r["duration_min"]) if r["duration_min"].isdigit() else 30
            price = f"{float(r['base_price']):.2f}"
            values_lines.append(
                f"    ('{name}', '{desc}', {duration}, {price}, "
                f"(SELECT id_garment_type FROM cci_garment_type WHERE name = '{garment}'), true),"
            )

    if values_lines:
        # strip trailing comma on the last actual VALUES row
        for i in range(len(values_lines) - 1, -1, -1):
            if values_lines[i].endswith(","):
                values_lines[i] = values_lines[i][:-1]
                break
        body = "\n".join(values_lines) + "\nON CONFLICT (name, id_garment_type) DO NOTHING;\n"
    else:
        body = "    -- (no net-new services to insert)\nON CONFLICT (name, id_garment_type) DO NOTHING;\n"

    footer = "\nCOMMIT;\n"
    V4_OUT.write_text(header + body + footer, encoding="utf-8")

    print(f"price overrides applied from missing_price.csv: {overrides_applied}")
    print(f"normalized rows:    {len(deduped)} priced, {len(missing_price)} unpriced")
    print(f"unknown garment:    {sorted(set(unknown_garment))}")
    print(f"net-new vs V2:      {len(net_new)}")
    print(f"wrote: {CSV_OUT.relative_to(ROOT)}")
    print(f"wrote: {CSV_NOPRICE.relative_to(ROOT)}")
    print(f"wrote: {V4_OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
