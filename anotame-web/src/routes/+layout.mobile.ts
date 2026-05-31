// Mobile-only root layout config — swapped into place as +layout.ts during
// `bun run build:mobile`. Disables SSR and prerendering so the static export
// produces a single-page index.html shell for the Capacitor WebView.
export const ssr = false;
export const prerender = false;
