# In-App User Manual Stage 1

The first user-manual stage is an app-native, static Svelte manual available to authenticated users from the dashboard grid and full menu. It documents current behavior only, uses Paraglide messages for Spanish and English, and keeps employee-visible admin content to high-level "admin managed" guidance.

**Considered Options:** Static in-app page, Markdown documentation, CMS-backed help, or interactive guided tours first.

**Decision:** Ship the static in-app page first. Defer guided tours until the manual content is stable enough to drive selectors and flows.

**Follow-ups:** Add Driver.js-style guided tours after stage 1, add user-controlled dock customization later, and preserve user context such as scroll/filter/view position across all app areas in a later pass.

**Consequences:** The manual remains lightweight and role-aware now. Future interactive help must reuse this manual's task structure instead of becoming a separate source of truth.
