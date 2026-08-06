# ADR 0005: Revocable public ticket links

Anotame tickets may be shared with a Customer without granting access to the authenticated order view.

## Decision

Each share link uses a 256-bit random bearer token. Sales stores only its SHA-256 hash in `tco_ticket_share`; the raw token is returned once, when staff creates the link. Links are independently revocable and expire no sooner than 90 days after creation or 30 days after the committed deadline.

Public reads use a dedicated, `@PermitAll` endpoint and return a restricted ticket projection. They never expose internal order IDs, customer IDs, payment history, audit records, staff data, email, or unmasked phone numbers. The pickup code is intentionally visible only for active orders because possessing the shared ticket is equivalent to possessing its physical counterpart.

The ticket is a live projection: payment, deadline, and status corrections are reflected immediately. The authenticated audit log remains the source of historical changes.

Receipt branding is supplied by Operations through a separate whitelisted public receipt-settings endpoint, avoiding a cross-service database dependency and preventing administrative establishment settings from being exposed.
