# One Branch Context per Staff Session

An **Establishment** is the business using Anotame. A **Branch** is one physical
location belonging to that Establishment. Multiple Branches may be active and
serving customers at the same time.

**Decision:** every authenticated staff session carries exactly one selected
`branch_id`. This is a session context rule, not a rule that limits an
Establishment to one active Branch or a User to one Employee Assignment.

- A User may have one or more active, date-valid Employee Assignments.
- With zero eligible assignments, authentication fails closed.
- With one eligible assignment, login may select it automatically.
- With multiple eligible assignments, the User must select one before Identity
  issues the normal staff JWT.
- A branch switch validates the requested Branch through Operations and issues
  a replacement JWT. It does not mutate the User's assignments.
- Separate browser or device sessions may select different authorized Branches.
- Every branch-scoped query and mutation uses the single `branch_id` from the
  current JWT. The client cannot override it with a request parameter.
- Establishment-wide administration requires an explicit permission and
  Establishment scope; it must not be represented by a missing or fallback
  Branch.

Operations continues to own Branches and Employee Assignments. Identity may ask
Operations for eligible Branches or validate a requested Branch, but it does not
read Operations tables directly.

## Current single-branch rollout

The current Phase 0 implementation automatically resolves a Branch only when a
User has exactly one active, date-valid assignment. It rejects multiple
assignments because the branch-selection response and UI do not exist yet. This
is acceptable while the production Establishment has one Branch, but it is a
transitional behavior rather than the long-term invariant.

Do not add a unique database constraint on `tce_employee_assignment.id_user`.
Such a constraint would prevent the intended multi-Branch assignment model. The
existing `UNIQUE (id_user, id_branch)` constraint correctly prevents duplicate
assignments to the same Branch while allowing assignments to different
Branches.

## Gate before opening a second Branch

Before a second production Branch is activated:

1. Operations returns the eligible Branch list and can validate a requested
   Branch for a User.
2. Identity returns a short-lived branch-selection challenge after valid
   credentials when more than one Branch is eligible; the normal staff JWT is
   issued only after a valid selection.
3. The frontend provides a Branch chooser at login and a deliberate branch
   switch action that replaces the session token.
4. Audit events record the selected Branch and branch switches without logging
   credentials or tokens.
5. Staging tests cover zero, one, and multiple assignments; unauthorized branch
   selection; two simultaneous sessions using different Branches; and
   cross-Branch read/write denial.
6. The complete flow passes in staging before the same source changes are
   promoted to production.

## Relationship to ADR 0006

This ADR replaces only ADR 0006's temporary exactly-one-assignment session rule.
ADR 0006's ownership and integration decisions remain: Operations owns the
source of truth, Identity calls it over private authenticated HTTP, and both
services fail closed rather than using a configured fallback.
