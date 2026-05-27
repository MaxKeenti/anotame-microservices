# Service-Owned Databases and Flyway

Anotame uses separate PostgreSQL databases for identity, catalog, sales, and operations, with each Quarkus service owning its own Flyway migration history. This replaced the earlier shared database setup because database-level cross-service foreign keys cannot survive true service isolation, and service-owned schemas reduce credential blast radius while making missing production configuration fail visibly.

**Considered Options:** Keep a shared database with schemas per service, or isolate each service into its own database.

**Consequences:** Cross-service integrity is enforced at the application boundary, not with database foreign keys. Local development starts four database containers, and manual seed/import scripts are not part of the normal schema lifecycle.
