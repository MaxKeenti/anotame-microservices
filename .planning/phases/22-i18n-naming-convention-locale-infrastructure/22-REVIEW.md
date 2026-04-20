---
phase: 22-i18n-naming-convention-locale-infrastructure
reviewed: 2026-04-20T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/dto/UpdateLocaleRequest.java
  - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/dto/UserResponse.java
  - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java
  - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/UserService.java
  - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/domain/model/User.java
  - anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/UserController.java
  - anotame-api/backend/identity-service/src/main/resources/db/migration/V2__add_user_locale.sql
  - anotame-web/.gitignore
  - anotame-web/messages/en.json
  - anotame-web/messages/es.json
  - anotame-web/package.json
  - anotame-web/project.inlang/.gitignore
  - anotame-web/project.inlang/settings.json
  - anotame-web/scripts/lint-i18n-keys.js
  - anotame-web/src/app.html
  - anotame-web/src/hooks.server.ts
  - anotame-web/src/lib/services/auth.svelte.ts
  - anotame-web/src/routes/(app)/dashboard/settings/+page.svelte
  - anotame-web/vite.config.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-04-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

This phase introduces locale infrastructure across two layers: a Java/Quarkus backend column + PATCH endpoint for persisting user locale preference, and a SvelteKit/Paraglide frontend for cookie-based locale resolution with a settings UI. The overall design is sound and the integration is clean. However, there are four warnings that could produce silent failures or incorrect behavior in edge cases, and four informational items worth addressing before the feature is considered complete.

---

## Warnings

### WR-01: `UpdateLocaleRequest.locale` Can Be `null` — Validation Silently Passes

**File:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/dto/UpdateLocaleRequest.java:8-9`

**Issue:** The `@Pattern` constraint on `locale` only fires when the value is non-null. If a client sends `{}` or `{"locale": null}`, Bean Validation will skip the pattern check and `updateLocale` will call `user.setLocale(null)`, overwriting the stored locale with `null`. The column in the database is `NOT NULL`, so this will throw a database constraint violation at commit time — but as an unhandled runtime exception rather than a structured 400 response, leaking an internal error message to the caller.

**Fix:** Add `@NotNull` to produce a clean 400 before the service layer is entered:
```java
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Data
public class UpdateLocaleRequest {
    @NotNull(message = "Locale must not be null")
    @Pattern(regexp = "^(es|en)$", message = "Locale must be 'es' or 'en'")
    private String locale;
}
```

---

### WR-02: `updateLocale` PATCH Endpoint Has No Authorization Check

**File:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/infrastructure/web/controller/UserController.java:54-60`

**Issue:** Every other mutating endpoint (`createUser`, `updateUser`, `deleteUser`) is guarded with `@RolesAllowed("ADMIN")`. The `updateLocale` endpoint only inherits the class-level `@Authenticated`, meaning any authenticated user — including `EMPLOYEE` — can send a `PATCH /users/{id}/locale` with any other user's UUID and silently overwrite their locale preference. There is no check that the authenticated user's ID matches the `{id}` path parameter.

**Fix:** Either (a) restrict to "ADMIN" if locale is considered an admin-managed property, or (b) inject the security context and verify the caller owns the resource:
```java
@PATCH
@Path("/{id}/locale")
public jakarta.ws.rs.core.Response updateLocale(
        @PathParam("id") UUID id,
        @jakarta.validation.Valid UpdateLocaleRequest request,
        @Context io.quarkus.security.identity.SecurityIdentity identity) {

    // Only the owning user (or an ADMIN) may change their locale
    UUID callerId = UUID.fromString(identity.getPrincipal().getName()); // adjust extraction to match your JWT claims
    if (!callerId.equals(id) && !identity.hasRole("ADMIN")) {
        return jakarta.ws.rs.core.Response.status(403).build();
    }

    userService.updateLocale(id, request.getLocale());
    return jakarta.ws.rs.core.Response.noContent().build();
}
```

---

### WR-03: `setLocaleCookie` Sets No `Secure` Flag — Cookie Sent Over Plain HTTP in Non-HTTPS Environments

**File:** `anotame-web/src/lib/services/auth.svelte.ts:45`

**Issue:** The `PARAGLIDE_LOCALE` cookie is written with `SameSite=Lax` but without the `Secure` flag. In production this is harmless if TLS is enforced at the load balancer, but in staging or developer environments over plain HTTP the cookie can be read or tampered with via network interception. Since locale is not a secret value, confidentiality is not the concern — but consistency with the project's HttpOnly auth cookie patterns is.

More practically: the `setLocaleCookie` call on line 73 during logout sets `max-age=0` to clear the cookie but uses a different cookie string format from line 45. If the original cookie was set with `path=/` and the clear call also has `path=/`, they will match — this is correct — but the inconsistency in format is a maintenance hazard.

**Fix:** Extract the cookie into a shared helper and optionally add `Secure` for production:
```typescript
private setLocaleCookie(locale: string, maxAge = 60 * 60 * 24 * 365) {
    if (typeof document === 'undefined') return;
    const secure = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `PARAGLIDE_LOCALE=${locale};path=/;max-age=${maxAge};SameSite=Lax${secure}`;
}
```
Then both `login` and `logout` call `this.setLocaleCookie('', 0)` instead of the inline clear.

---

### WR-04: `handleLocaleChange` Toast Success Message Is Hard-Coded in English/Spanish — Not Internationalized

**File:** `anotame-web/src/routes/(app)/dashboard/settings/+page.svelte:50`

**Issue:** The success toast uses a ternary that hard-codes the message strings:
```svelte
toast.success(newLocale === 'en' ? 'Language changed to English' : 'Idioma cambiado a Español');
```
This is inconsistent with the project rule that "all text must be internationalized using Paraglide" (AI_RULES.md §3). After a locale swap, `setLocale` has already been called with `reload: false`, so `m.*()` functions would return messages in the new locale at the point the toast fires. This is intentional — you want the toast to confirm in the newly selected language — but the mechanism should still go through the i18n pipeline, not hard-coded strings. Additionally, if a third locale is ever added, this ternary will silently fall through to Spanish for any new locale.

**Fix:** Add message keys for the success notification and use them:
```json
// messages/en.json
"settings.language.changed": "Language changed to English"

// messages/es.json
"settings.language.changed": "Idioma cambiado a Español"
```
```svelte
toast.success(m['settings.language.changed']());
```
Since `setLocale` was already called before the toast, Paraglide will resolve the correct language.

---

## Info

### IN-01: `lint-i18n-keys.js` — Regex Does Not Match Keys With Three Dot-Separated Segments (Three Is Actually Correct by Convention, Script Is Self-Contradictory)

**File:** `anotame-web/scripts/lint-i18n-keys.js:10`

**Issue:** The script comment says the convention is `domain.component.purpose (2-3 camelCase segments)`, but the regex `^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$` allows only 2 or 3 total segments (1 base + 1-2 dot groups), which is correct for the convention. However, all existing keys use exactly 3 segments (e.g., `settings.page.title`). This is fine as-is, but the comment saying "2-3 segments" could mislead — two-segment keys like `settings.title` would also pass. Verify whether two-segment keys are intentionally allowed, and if not, change `{1,2}` to `{2}`.

**Fix (if three segments are always required):**
```js
const KEY_REGEX = /^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){2}$/;
```

---

### IN-02: `AuthService` Builds `UserResponse` Inline Three Times — `mapToResponse` Helper Absent

**File:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/application/service/AuthService.java:41-49, 61-69, 111-119`

**Issue:** The same `UserResponse.builder()...build()` pattern is duplicated three times inside `AuthService`. `UserService` already has a private `mapToResponse(User)` helper. Any future field addition to `UserResponse` (e.g., a display name, time zone) must be added in four places instead of one.

**Fix:** Extract a private helper in `AuthService` mirroring `UserService.mapToResponse`, or (better for DDD purity) move the mapping to `UserResponse` as a static factory method. The quickest patch:
```java
private com.anotame.identity.application.dto.UserResponse toUserResponse(User user) {
    return com.anotame.identity.application.dto.UserResponse.builder()
        .id(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .firstName(user.getFirstName())
        .lastName(user.getLastName())
        .role(user.getRole() != null ? user.getRole().getCode() : null)
        .locale(user.getLocale())
        .build();
}
```

---

### IN-03: `login(credentials: any)` in `AuthService` — `any` Type Bypasses Type Safety

**File:** `anotame-web/src/lib/services/auth.svelte.ts:49`

**Issue:** The `credentials` parameter is typed as `any`, which prevents the TypeScript compiler from catching mismatched property names or missing fields at the call site. The project uses TypeScript strictly elsewhere.

**Fix:** Define a `LoginCredentials` interface and use it:
```typescript
export interface LoginCredentials {
    username: string;
    password: string;
}

async login(credentials: LoginCredentials): Promise<void> { ... }
```

---

### IN-04: `User` Entity Has Both `active` and `deleted` Fields — Soft-Delete State Is Redundant

**File:** `anotame-api/backend/identity-service/src/main/java/com/anotame/identity/domain/model/User.java:45-65`

**Issue:** The entity carries both `is_active` (`active = true`) and `is_deleted` (`deleted = false`). The `@SQLRestriction` filters on `is_deleted = false`, which is consistent with the project standard. The `is_active` field is set to `true` by default but nothing in the reviewed code ever sets it to `false` or queries it. This is dead state — it adds column noise and risks diverging from `is_deleted` (e.g., a user could be `active=true, deleted=true` or `active=false, deleted=false`). This field was not introduced in this phase, but the locale work touches the entity and this is worth flagging.

**Fix:** If `is_active` is not used by any business logic, remove the column and field. If it is intended for future use (e.g., account suspension without full deletion), document the distinction clearly with a comment or enforce a business rule that `active=false` implies specific behavior.

---

_Reviewed: 2026-04-20T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
