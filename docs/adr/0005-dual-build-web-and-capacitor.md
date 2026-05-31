# Dual-Build Web + Capacitor with Platform-Aware Auth

`anotame-web` ships from one SvelteKit source tree as two artifacts: the Railway-deployed Node server (adapter-node) and a Capacitor static bundle for iOS/Android staff devices (adapter-static). The build branches on `MOBILE=1`; native code paths gate on `Capacitor.isNativePlatform()`.

Native auth uses a `Bearer` token from `@capacitor/preferences` because cross-origin HttpOnly cookies cannot reach the backend from `capacitor://localhost` (WKWebView ITP, SameSite). Web auth is unchanged. The identity login endpoint now returns the JWT in the response body alongside the cookie; web ignores the token, native stores it. All four Quarkus services accept Capacitor origins via `ANOTAME_CORS_ORIGINS`.

App Store guideline 4.2 prohibits pure WebView wrappers, so v1 ships Camera (garment intake) and Biometric login as native plugins. Push notifications and barcode scanning are deferred.

**Considered options:** A separate mobile SvelteKit app was rejected because it would duplicate every staff screen, services layer, and i18n catalogue. A second `svelte.config.mobile.js` was rejected because SvelteKit always loads `svelte.config.js`. Server-side rendering for the native bundle was rejected because adapter-static has no Node runtime, and a shared `ssr = false` would regress the web build's theme load and admin guard — so the mobile-only `+layout.ts` is swapped into place by a build script.

**Consequences:** Backend URLs for native are baked at build time via `$env/static/public`, so the mobile build pipeline (CI/dev, not Railway) mirrors Railway env values locally. New API calls must go through `getApiBase(service)`, never `/api/...` literals — the universal `+layout.ts` loads no longer have a Node proxy in the native build. Adding a native capability requires both a Capacitor plugin and a corresponding `isNativeApp()` branch in shared code.
