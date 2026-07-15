# Identity Resolves Branch Assignments Through Operations

Identity issues staff JWTs, while Operations owns `tce_employee_assignment` and
the branch lifecycle. Identity must not query that table through its own
datasource or silently substitute a configured branch.

**Decision:** Identity resolves a user's branch context through an
Operations-owned private HTTP endpoint during login and credential refresh.
The call uses Railway private networking plus a shared internal service
credential. The current Phase 0 endpoint returns a branch only when exactly one
assignment is active and date-valid. Zero assignments return not found;
multiple assignments return conflict until the branch-selection flow defined in
[ADR 0007](./0007-one-branch-context-per-staff-session.md) is implemented.
Identity maps these states to fail-closed authentication and maps connectivity
or upstream failures to service unavailable.

The durable token rule is exactly one selected Branch per authenticated staff
session. Multiple Branches and multiple Employee Assignments may exist; do not
add a fallback or a unique constraint on User alone. ADR 0007 defines the
multi-Branch selection and establishment-wide administrator policy.

**Consequences:** Login depends on Operations availability. Identity has short
connection and read timeouts, never reads Operations tables directly, and no
longer supports `APP_DEFAULT_BRANCH_ID`. The same internal credential must be
present on Identity and Operations before deployment. The API rejects ambiguity
until branch selection exists, but the database must continue allowing one User
to be assigned to different Branches.
