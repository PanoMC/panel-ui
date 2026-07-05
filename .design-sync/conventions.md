# Pano Panel — build conventions

These components are the **real Svelte 5 components of the Pano Minecraft-server admin panel**, bridged to React. Import them from the DS package; they render themselves with live demo context (admin user "Herobrine", server "CraftRealms Survival", dark theme) — no provider setup is required.

## Canvas & theming

Wrap every page-level design in `PanoSurface` — it applies the panel's background, text color, and theme tokens:

```jsx
import { PanoSurface, CardHeader, PlayerStatusBadge } from '@panomc/panel-ui';

<PanoSurface theme="dark">            {/* 'dark' is the product default */}
  <div className="card mb-3">
    <CardHeader
      left={<h5 className="m-0 fw-bold">Players</h5>}
      right={<button className="btn btn-sm btn-primary" type="button">
        <i className="fa-solid fa-plus me-1"></i>Add Player</button>}
    />
    <div className="card-body">
      <PlayerStatusBadge lastActivityTime={Date.now()} />
    </div>
  </div>
</PanoSurface>
```

`theme` accepts `dark` (default), `light`, and the named Pano themes `copper`, `emerald`, `midnight`, `crimson`. Theming is Bootstrap 5 color modes: any `data-bs-theme` attribute on a wrapper re-themes everything inside it.

## Styling idiom — Bootstrap 5 utilities with Pano tokens

Style your own layout glue with **Bootstrap 5.3 classes**; the shipped stylesheet re-skins them with Pano's tokens (Quicksand font, 9.6px radius, hard 0/1.5px shadows, `$primary #044389`, `$secondary #ffc947`, `$danger #ed5565`, `$success #4ecdc4`, `$warning #967adc`, `$info #1e96fc`). Never write bespoke CSS for things these cover:

- Layout: `container`, `row`, `col-*`, `d-flex`, `gap-2`/`gap-3`, `justify-content-*`, `align-items-*`, `mb-3`, `p-4`
- Surfaces: `card`, `card-header`, `card-body`, `card-footer`, `modal-content`, `list-group`
- Actions: `btn btn-primary|secondary|danger|success|link`, `btn-sm`, `btn-outline-*`
- Status: `badge rounded-pill text-bg-success|danger|primary|secondary`, `bg-*-subtle`, `text-*-emphasis`, `alert alert-*`
- Nav: `nav nav-pills`, `nav-link active`, `breadcrumb`, `pagination`
- Forms: `form-control`, `form-select`, `form-label`, `form-check`, `input-group`
- Text: `fw-bold` (700), default weight is 500; body font is Quicksand — never set another font-family.

Icons are **Font Awesome 6 Free**: `<i className="fa-solid fa-server"></i>` (also `fa-brands`). No other icon set ships.

## Component API notes

- Per-component props are in each `<Name>.d.ts`; usage guidance in `<Name>.prompt.md`. React children/element props render into the component's Svelte slots (e.g. `CardHeader` takes `left`/`middle`/`right`).
- **Modals** (58 of them) render hidden by default. In static designs pass `previewOpen` to show the dialog open and in-flow. Imperative flow (what the app does): `ConfirmActionModal.show('i18n.key', onYes)` — module APIs are attached as statics on each modal component.
- Text is self-translated via the panel's i18n (en-US). Components labeled by i18n render English automatically.
- Demo context stores are adjustable via `panoStores` (e.g. `panoStores.notificationCount.set(9)`).
- Don't rely on `/api/...` or `/assets/img/...` URLs for images — there is no backend; pass explicit image `src` (data URIs or absolute URLs) where a component accepts one.

## Where the truth lives

- `styles.css` → imports `_ds_bundle.css` (the full compiled Bootstrap 5 + Pano skin — read it before inventing a class) and `fonts/fonts.css` (Quicksand + Font Awesome faces).
- `components/<group>/<Name>/` — d.ts (props contract), prompt.md (usage), html (visual reference).
