---
id: SEED-005
status: dormant
planted: 2026-04-04
planted_during: v1.2 / Phase 11
trigger_when: Any future UI/UX-heavy phase
scope: Small
---

# SEED-005: Mandate UI Contract (UI-SPEC.md) for UI Phases

## Why This Matters

As we scale the application and perform UI standardization (v1.2), there's a high risk of design drift if modifications are made ad-hoc. A UI contract ensures that every visual change is documented and follows established patterns (shadcn, DataTableWrapper, etc.) *before* implementation starts. This saves time on rework and ensures a premium, consistent user experience.

## When to Surface

**Trigger:** Any future UI/UX-heavy phase

This seed should be presented during `/gsd-new-milestone` or `/gsd-plan-phase` when:
- The phase involves creating or modifying Svelte components.
- The task is categorized under UI Standardization or UX Refinement.
- We are starting Phase 12 or any subsequent phase with visual impact.

## Scope Estimate

**Small** — This is a procedural requirement. It involves:
1. Running `/gsd-ui-phase` during the planning stage of a new phase.
2. Reviewing the generated `UI-SPEC.md` with the user.
3. Using the spec as the "source of truth" during the execution and verification stages.

## Breadcrumbs

Related code and decisions found in the current codebase:

- [AI_RULES.md](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/AI_RULES.md): Contains the core design standards that the UI contract must uphold.
- [.agent/skills/gsd-ui-phase/SKILL.md](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.agent/skills/gsd-ui-phase/SKILL.md): The tool to be used for generating these contracts.

## Notes

- This should be treated as a "Pre-flight Check" for any UI-related work.
- It helps maintain the "Premium Aesthetic" mandated in the system instructions.
