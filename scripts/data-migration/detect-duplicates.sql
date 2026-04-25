-- detect-duplicates.sql
-- Queries to find potential duplicates in catalog data.
-- Run manually and review results — deduplication requires human judgment.

-- ============================================================
-- 1. Exact duplicate garment type names
-- ============================================================
SELECT name, COUNT(*) AS occurrences
FROM cci_garment_type
WHERE is_deleted = false
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;

-- ============================================================
-- 2. Exact duplicate service names
-- ============================================================
SELECT name, COUNT(*) AS occurrences
FROM cci_service
WHERE is_deleted = false
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;

-- ============================================================
-- 3. Similar service names (Levenshtein distance <= 3)
--    Requires: CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
-- ============================================================
-- Uncomment after enabling the extension:
--
-- SELECT a.name AS service_a, b.name AS service_b,
--        levenshtein(LOWER(a.name), LOWER(b.name)) AS distance
-- FROM cci_service a
-- JOIN cci_service b ON a.id_service < b.id_service
-- WHERE a.is_deleted = false AND b.is_deleted = false
--   AND levenshtein(LOWER(a.name), LOWER(b.name)) <= 3
-- ORDER BY distance;

-- ============================================================
-- 4. Duplicate price list items (same service in same list)
-- ============================================================
SELECT pl.name AS price_list, s.name AS service, COUNT(*) AS occurrences
FROM tcc_price_list_item pli
JOIN tcc_price_list pl ON pl.id_price_list = pli.id_price_list
JOIN cci_service s ON s.id_service = pli.id_service
GROUP BY pl.name, s.name
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;

-- ============================================================
-- 5. Services with identical base_price + duration (potential copies)
-- ============================================================
SELECT base_price, default_duration_min,
       STRING_AGG(name, ', ' ORDER BY name) AS services,
       COUNT(*) AS count
FROM cci_service
WHERE is_deleted = false
GROUP BY base_price, default_duration_min
HAVING COUNT(*) > 1
ORDER BY count DESC;
