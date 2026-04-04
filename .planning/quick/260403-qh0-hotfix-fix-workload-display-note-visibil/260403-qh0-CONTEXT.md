# Quick Task 260403-qh0: Hotfix: Fix workload display, note visibility, and missing order details - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Task Boundary

Hotfix multiple production issues:
1. Fix order wizard workload display (showing only current session).
2. Fix KPI dashboard workload (showing empty even with active orders).
3. Fix "Notas" text visibility (dark/light contrast) using yellow theme.
4. Add missing workload/adjustments summary to order detail page.

</domain>

<decisions>
## Implementation Decisions

### 1. Workload Persistence
- **Decision:** Store `totalDurationMin` in the database.
- **Action:** Update `init.sql` (baseline) and ensure Flyway migrations handle the new column.

### 2. Note Styling
- **Decision:** Yellow background with WCAG-compliant contrast.
- **Action:** Use a high-contrast text color (likely a dark gray/black for light mode, and a specifically tuned light yellow for dark mode) to ensure readability.

### 3. KPI / Dashboard Data
- **Decision:** Only show days with active workload.
- **Action:** Fix the data-fetching/logic error where currently used minutes are displayed as empty (0).

### 4. Order Detail Detail
- **Decision:** Show summary values in the details card.
- **Action:** Display total workload and price adjustments in the summary section of the order detail.

</decisions>
