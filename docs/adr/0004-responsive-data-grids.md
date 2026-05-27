# Responsive Data Grids

Desktop data management pages use `DataTableWrapper`, while mobile views switch to `CardGridWrapper` through `useIsMobile()`. Both wrappers share a table-like props API, and column `meta.cardGroup` values decide whether fields appear in the mobile card header, body, or remain hidden.

This keeps desktop table behavior stable while giving touch-first screens a layout that is readable at narrow widths.

**Consequences:** Pages that expose tabular management data should define columns once, provide `cardGroup` metadata for mobile priority, and pass named snippets for action cells that are rendered by both wrappers. Do not force desktop TanStack table markup to behave like mobile cards.
