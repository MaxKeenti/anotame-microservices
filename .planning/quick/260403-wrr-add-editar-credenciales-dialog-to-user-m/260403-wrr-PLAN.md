---
phase: quick
plan: 260403-wrr
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-web/src/routes/\(app\)/+layout.svelte
autonomous: true
requirements: []
user_setup: []
must_haves:
  truths:
    - "User can click 'Editar Credenciales' in menu and see the credentials dialog"
    - "Dialog opens with current user data (firstName, lastName, email)"
    - "User can edit and save credentials via dialog"
    - "Dialog closes after successful save"
  artifacts:
    - path: anotame-web/src/routes/\(app\)/+layout.svelte
      provides: "User dialog integration with menu modal"
  key_links:
    - from: menu-modal.svelte
      to: "user-dialog.svelte"
      via: "onOpenProfile callback"
    - from: +layout.svelte
      to: authService
      via: "access current user data"
---

<objective>
Wire the existing "Editar Credenciales" button in the user menu to open the user-dialog component with current user data, allowing staff to edit their own credentials (firstName, lastName, email).

Purpose: Enable users to edit their own profile information from the menu
Output: Functional credentials dialog accessible from menu
</objective>

<execution_context>
@anotame-web/src/routes/\(app\)/+layout.svelte (current layout)
@anotame-web/src/lib/components/layout/menu-modal.svelte (menu with button)
@anotame-web/src/lib/components/users/user-dialog.svelte (user edit dialog)
@anotame-web/src/lib/services/auth.svelte (current user data)
</execution_context>

<context>
The menu modal already has "Editar Credenciales" button that calls `onOpenProfile()` callback. The app layout has `isProfileOpen` state but doesn't render the user-dialog component yet.

Key requirements from AI_RULES.md:
- Use shadcn-svelte components (Dialog, Button, etc.)
- Use sveltekit-superforms for form handling
- All text must be internationalized via Paraglide
- Touch-first design (large touch targets)
</context>

<tasks>

<task type="auto">
  <name>Task: Wire UserDialog to app layout with current user data</name>
  <files>anotame-web/src/routes/\(app\)/+layout.svelte</files>
  <action>
Import UserDialog component at the top. Initialize `currentUserForEdit` state to track whether dialog is open and which user to edit. When `isProfileOpen` is true, set `currentUserForEdit` to the current logged-in user (from authService.user). Render the UserDialog component after MenuModal, passing:
- `item={currentUserForEdit}` (the user to edit)
- `onClose={() => { isProfileOpen = false; currentUserForEdit = null; }}` (close dialog and reset state)
- `onSuccess={() => { /* refresh user if needed */ }}` (callback after save)

The dialog will display with the user's firstName, lastName, and email fields editable (username and password hidden for existing users per user-dialog.svelte logic).
  </action>
  <verify>
    <automated>bun run build</automated>
  </verify>
  <done>Dialog renders when user clicks 'Editar Credenciales', closes after save, displays current user data</done>
</task>

</tasks>

<verification>
1. Navigate to app and click Menu button
2. Click "Editar Credenciales" link
3. Verify dialog opens with current user's firstName, lastName, email pre-filled
4. Edit one field and click "Guardar Cambios"
5. Verify dialog closes and toast shows "Usuario actualizado exitosamente"
6. Reopen menu and click "Editar Credenciales" again to verify changes persisted
</verification>

<success_criteria>
- UserDialog component imported and rendered in app layout
- Dialog opens when "Editar Credenciales" clicked from menu
- Current logged-in user data (firstName, lastName, email) displays in dialog
- User can edit and save changes successfully
- Dialog closes after save
- No build errors: `bun run build` exits 0
</success_criteria>

<output>
After completion, create `.planning/quick/260403-wrr-add-editar-credenciales-dialog-to-user-m/260403-wrr-SUMMARY.md`
</output>
