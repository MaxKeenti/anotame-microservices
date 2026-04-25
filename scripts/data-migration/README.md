# Data Migration Toolkit - Anotame V2

Pipeline para digitalizar hojas de precios en papel e importarlas al esquema del catálogo.

## Flujo recomendado

```
Hojas de papel
    │
    ▼  (Paso 1: Digitalizar)
Fotos con celular → Google Lens / Apple Live Text → Google Sheets
    │
    ▼  (Paso 2: Exportar)
CSV files (garment_types.csv, services.csv, price_list_items.csv)
    │
    ▼  (Paso 3: Validar)
validate-csv.sh → reporta duplicados, campos faltantes, precios sospechosos
    │
    ▼  (Paso 4: Importar)
import-seed-data.sql → INSERT directo a PostgreSQL del catalog-service
```

## Paso 1: Digitalizar las hojas

**NO escribas todo a mano.** Usa OCR del celular:

1. **Google Lens** (Android/iOS): Toma foto → selecciona texto → copia a Google Sheets
2. **Apple Live Text** (iOS 15+): Abre Cámara → toca el texto detectado → copia
3. **Google Sheets app**: Abre la hoja, pega el texto extraído, ajusta columnas

Tip: Si las hojas están organizadas en tablas, Google Lens las detecta como tabla directamente.

## Paso 2: Llenar los CSV templates

Exporta desde Google Sheets a CSV, o llena los templates directamente:

- `templates/garment_types.csv` — Tipos de prenda
- `templates/services.csv` — Servicios con precios base
- `templates/price_list_items.csv` — Precios específicos por lista

## Paso 3: Validar

```bash
cd scripts/data-migration
chmod +x validate-csv.sh
./validate-csv.sh
```

Reporta: campos vacíos, duplicados por nombre, precios fuera de rango.

## Paso 4: Importar

```bash
# Opción A: Contra la DB local de Docker
docker exec -i anotame-catalog-db psql -U catalog -d catalog_db < import-seed-data.sql

# Opción B: Contra cualquier PostgreSQL
psql -h localhost -p 5432 -U catalog -d catalog_db -f import-seed-data.sql
```

## Paso 5: Traducir datos existentes al español

```bash
# Aplica la migración de traducción EN→ES sobre los datos seed actuales
psql -h localhost -p 5432 -U catalog -d catalog_db -f V2__translate_seed_data_to_spanish.sql
```

## Análisis de duplicados (milestone futuro)

El archivo `detect-duplicates.sql` contiene queries para detectar:
- Nombres de servicio similares (Levenshtein)
- Tipos de prenda duplicados
- Items de precio duplicados por servicio+lista

Esto se recomienda como milestone separado ya que requiere análisis humano para decidir qué conservar.

## Notas

- Todos los datos van en **español** (nombres, descripciones)
- El esquema (tablas, columnas) se mantiene en **inglés**
- Los precios usan NUMERIC(19,4) — usa punto decimal, no coma
- Los UUIDs se generan automáticamente por PostgreSQL
