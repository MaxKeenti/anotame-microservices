# Identity Resolves Branch Assignments Through Operations

Identity issues staff JWTs, while Operations owns `tce_employee_assignment` and
the branch lifecycle. Identity must not query that table through its own
datasource or silently substitute a configured branch.

**Decision:** Identity resolves a user's active branch through an
Operations-owned private HTTP endpoint during login and credential refresh.
The call uses Railway private networking plus a shared internal service
credential. Operations returns a branch only when exactly one assignment is
active and date-valid. Zero assignments return not found; multiple assignments
return conflict. Identity maps both states to fail-closed authentication and
maps connectivity or upstream failures to service unavailable.

The current token contract requires one active branch for every staff user,
including administrators. A future multi-branch session or establishment-wide
administrator policy must replace this ADR rather than adding a fallback.

**Consequences:** Login depends on Operations availability. Identity has short
connection and read timeouts, never reads Operations tables directly, and no
longer supports `APP_DEFAULT_BRANCH_ID`. The same internal credential must be
present on Identity and Operations before deployment. A database constraint for
one active assignment per user is deferred until existing production rows are
checked and cleaned; the API rejects ambiguity in the meantime.
