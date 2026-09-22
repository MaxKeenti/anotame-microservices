# CLAUDE.md

**See [AI_RULES.md](./AI_RULES.md) for development standards and conventions.**

This project uses **bun** as the package manager and script runner (no lockfile is committed, so it isn't obvious from a glance). Use `bun run <script>` (e.g. `bun run dev`, `bun run build`, `bun run check`), not npm. Note that `bun run build` fires the `prebuild` hook, which runs two gates: `lint:i18n` (message-key naming) and `lint:routes` (route pages compose primitives and components — see `docs/adr/0006-route-pages-compose.md`). Run `bun run lint:routes` directly to see violations without a full build.