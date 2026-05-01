#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
ERRORS=0

echo "=== Anotame CSV Data Validator ==="
echo ""

# --- Helper functions ---
check_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "  SKIP: $file not found"
        return 1
    fi
    return 0
}

count_lines() {
    local file="$1"
    tail -n +2 "$file" | grep -c '[^[:space:]]' || echo 0
}

check_empty_fields() {
    local file="$1"
    local label="$2"
    local empty_count
    empty_count=$(tail -n +2 "$file" | awk -F',' '{for(i=1;i<=NF;i++) if($i=="") print NR+1": col "i}' | head -20)
    if [[ -n "$empty_count" ]]; then
        echo "  WARN: Empty fields in $label:"
        echo "$empty_count" | sed 's/^/    /'
        ERRORS=$((ERRORS + 1))
    fi
}

check_duplicate_names() {
    local file="$1"
    local label="$2"
    local col="${3:-1}"
    local dupes
    dupes=$(tail -n +2 "$file" | cut -d',' -f"$col" | sort | uniq -d)
    if [[ -n "$dupes" ]]; then
        echo "  ERROR: Duplicate names in $label:"
        echo "$dupes" | sed 's/^/    /'
        ERRORS=$((ERRORS + 1))
    fi
}

# --- Validate garment_types.csv ---
echo "--- garment_types.csv ---"
if check_file "$TEMPLATES_DIR/garment_types.csv"; then
    echo "  Rows: $(count_lines "$TEMPLATES_DIR/garment_types.csv")"
    check_empty_fields "$TEMPLATES_DIR/garment_types.csv" "garment_types"
    check_duplicate_names "$TEMPLATES_DIR/garment_types.csv" "garment_types" 1
    echo "  OK"
fi
echo ""

# --- Validate services.csv ---
echo "--- services.csv ---"
if check_file "$TEMPLATES_DIR/services.csv"; then
    echo "  Rows: $(count_lines "$TEMPLATES_DIR/services.csv")"
    check_empty_fields "$TEMPLATES_DIR/services.csv" "services"
    check_duplicate_names "$TEMPLATES_DIR/services.csv" "services" 1

    # Check prices are positive numbers
    invalid_prices=$(tail -n +2 "$TEMPLATES_DIR/services.csv" | awk -F',' '{if($4+0 <= 0) print NR+1": "$1" → "$4}')
    if [[ -n "$invalid_prices" ]]; then
        echo "  WARN: Invalid or zero prices:"
        echo "$invalid_prices" | sed 's/^/    /'
        ERRORS=$((ERRORS + 1))
    fi

    # Check durations are positive integers
    invalid_durations=$(tail -n +2 "$TEMPLATES_DIR/services.csv" | awk -F',' '{if($3+0 <= 0) print NR+1": "$1" → "$3}')
    if [[ -n "$invalid_durations" ]]; then
        echo "  WARN: Invalid durations:"
        echo "$invalid_durations" | sed 's/^/    /'
        ERRORS=$((ERRORS + 1))
    fi

    # Check garment_type references exist
    if check_file "$TEMPLATES_DIR/garment_types.csv"; then
        garment_names=$(tail -n +2 "$TEMPLATES_DIR/garment_types.csv" | cut -d',' -f1 | sort)
        service_refs=$(tail -n +2 "$TEMPLATES_DIR/services.csv" | cut -d',' -f5 | sort -u)
        missing=$(comm -23 <(echo "$service_refs") <(echo "$garment_names"))
        if [[ -n "$missing" ]]; then
            echo "  ERROR: Services reference unknown garment types:"
            echo "$missing" | sed 's/^/    /'
            ERRORS=$((ERRORS + 1))
        fi
    fi
    echo "  OK"
fi
echo ""

# --- Validate price_list_items.csv ---
echo "--- price_list_items.csv ---"
if check_file "$TEMPLATES_DIR/price_list_items.csv"; then
    echo "  Rows: $(count_lines "$TEMPLATES_DIR/price_list_items.csv")"
    check_empty_fields "$TEMPLATES_DIR/price_list_items.csv" "price_list_items"

    # Check for duplicate service per price list
    dupes=$(tail -n +2 "$TEMPLATES_DIR/price_list_items.csv" | cut -d',' -f1,2 | sort | uniq -d)
    if [[ -n "$dupes" ]]; then
        echo "  ERROR: Duplicate service in same price list:"
        echo "$dupes" | sed 's/^/    /'
        ERRORS=$((ERRORS + 1))
    fi

    # Check service references exist
    if check_file "$TEMPLATES_DIR/services.csv"; then
        service_names=$(tail -n +2 "$TEMPLATES_DIR/services.csv" | cut -d',' -f1 | sort)
        item_refs=$(tail -n +2 "$TEMPLATES_DIR/price_list_items.csv" | cut -d',' -f2 | sort -u)
        missing=$(comm -23 <(echo "$item_refs") <(echo "$service_names"))
        if [[ -n "$missing" ]]; then
            echo "  ERROR: Price items reference unknown services:"
            echo "$missing" | sed 's/^/    /'
            ERRORS=$((ERRORS + 1))
        fi
    fi
    echo "  OK"
fi
echo ""

# --- Summary ---
if [[ $ERRORS -gt 0 ]]; then
    echo "=== VALIDATION FAILED: $ERRORS issue(s) found ==="
    exit 1
else
    echo "=== ALL CHECKS PASSED ==="
    exit 0
fi
