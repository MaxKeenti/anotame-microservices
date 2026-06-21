# El Hilván — App Implementation Brief

This is the context the **anotame-web** app needs in order to ship the *El Hilván*
brand mark. It maps the construction spec onto the concrete assets, sizes,
formats and colour tokens the code actually consumes. Hand the spec + this brief
together to design.

App stack: SvelteKit + `@vite-pwa/sveltekit` PWA. Package manager: **bun**.

---

## 1. Deliverables the app consumes (exact files)

| File the app loads | Size | Purpose | Background | Notes |
|---|---|---|---|---|
| `static/icons/icon-192.png` | 192×192 | PWA icon (`any`) | full-bleed (opaque) | standard home-screen icon |
| `static/icons/icon-512.png` | 512×512 | PWA icon (`any`) | full-bleed (opaque) | splash / high-DPI |
| `static/icons/icon-maskable-512.png` | 512×512 | PWA icon (`maskable`) | **full-bleed, opaque, NO rounded corners** | OS applies the mask — see §3 |
| `static/icons/apple-touch-icon.png` | 180×180 | iOS home screen | **opaque, square, no transparency, no pre-rounded corners** | iOS rounds it itself |
| `src/lib/assets/favicon.svg` | vector | browser tab favicon | — | **currently still the default Svelte flame — must be replaced**, see §4 |

Plus the two **vector masters** the PNGs are generated from (keep these the source of truth):
- `design/icons/icon-source.svg` — primary, framed icon master (currently the old "A" rounded-square)
- `design/icons/icon-maskable-source.svg` — full-bleed master for the maskable variant

> Design should deliver the two SVG masters; raster PNGs are derived from them
> (any vector→PNG export at the exact pixel sizes above). The app does **not**
> auto-generate icons — these files are checked into the repo as-is.

---

## 2. Which lockup goes on the app icon

The spec offers four lockups (Primary·White, On Signal Orange, One-colour·Ink,
Reversed·Knockout). For a phone home-screen icon the mark must read at 48px and
survive an opaque background. Recommended:

- **App icon (192/512/apple-touch):** the **"On Signal Orange"** lockup — white
  scalloped ring + holes knocked out of a solid Signal-Orange field. Highest
  contrast, fills the tile, matches the PWA theme tint.
- **Favicon:** a simplified one-colour variant (see §4).

This is a brand call — if you'd rather the icon be Primary-on-White (black ring /
blue holes on paper), say so and the theme colour in §5 changes to match.

---

## 3. Maskable safe-zone requirement (hard constraint)

`icon-maskable-512.png` is masked to arbitrary shapes (circle, squircle,
rounded-square, teardrop) by Android. **All critical geometry must fit inside the
central 80%** — i.e. a centred circle of radius 205px within the 512 frame — with
the brand colour bleeding to all four edges (no transparency, no built-in corner
radius).

Good news: the spec's own **Clear Space = 1U** rule (1U = 1/8 of the mark
diameter ⇒ 12.5% inset per side ⇒ mark occupies 75% of the frame) is *tighter*
than the 80% maskable zone, so an export that honours the spec's clear space is
automatically maskable-safe. Use that same framing for the non-maskable icons so
all four tiles look identical.

---

## 4. Favicon needs its own variant

`src/lib/assets/favicon.svg` is still the stock Svelte logo. At 16–32px the ten
scallops + four holes + ring will turn to mush. Design should provide a
**favicon-specific simplification** as an SVG — e.g. the scalloped silhouette with
the four holes as the only interior detail, one or two colours max, no thin ring.
Deliver it as `favicon.svg` (single vector, no fixed small raster needed — modern
browsers scale the SVG).

---

## 5. Colour tokens — reconcile spec vs. app

The spec and the live app currently disagree on the orange. Decide one value; it
must be set in **three** places that are wired today:

| Where | Current value | What it controls |
|---|---|---|
| `vite.config.ts` → manifest `theme_color` | `#c2410c` | PWA status-bar / task-switcher tint |
| `vite.config.ts` → manifest `background_color` | `#ffffff` | PWA splash background |
| `src/app.html` → `<meta name="theme-color">` | `#c2410c` | browser address-bar tint |
| `src/routes/layout.css` → `--primary` / `--accent` | `oklch(0.553 0.195 38.402)` ≈ `#c2410c` | in-app UI accent |

Spec palette for reference:

| Token | Spec hex | Original |
|---|---|---|
| Ink | `#101310` | `#000000` |
| Hilván Blue | `#0A4F86` | `#014F89` |
| Signal Orange | `#FF4500` | `#FF4600` |
| Thread White | `#FBF0F4` | button face |
| Paper | `#F1ECE3` | ground |

**Open decision for design/product:** keep the app's burnt orange (`#c2410c`) or
adopt the brand **Signal Orange `#FF4500`**? If we adopt Signal Orange, the four
values above (incl. the `--primary` oklch token) get updated to match, and the
icon background uses the same Signal Orange. Recommend: adopt `#FF4500` so the
icon, PWA tint and in-app accent are one colour.

---

## 6. Direction choice

The spec presents three refinements (A·True / B·Bold / C·Quiet). For app icons
rendered as small as 48px, **B·Bold** (heavier ring, deeper scallop) reads best
at size; **A·True** is fine if we never go below ~64px. Pick one direction for all
deliverables so favicon and home-screen icon are visually consistent.

---

## Summary — what to send back

1. `design/icons/icon-source.svg` — framed master, chosen lockup + direction.
2. `design/icons/icon-maskable-source.svg` — full-bleed, 80%-safe master.
3. `src/lib/assets/favicon.svg` — simplified favicon variant.
4. PNG exports at exactly 192 / 512 / 512-maskable / 180.
5. A confirmed orange hex (`#c2410c` vs `#FF4500`) for the three theme touchpoints.

Once those land, wiring them is mechanical — only the colour value in
`vite.config.ts`, `app.html` and `layout.css` may need editing; all icon paths
already exist.
