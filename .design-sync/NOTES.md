# design-sync notes — panel-ui

Repo is a **Svelte 5 app**, not a React DS. The sync ships a synthesized React
package built by `.design-sync/bridge/build-bridge.mjs` (see its header for the
three stages). `cfg.buildCmd` runs it; the converter consumes
`.design-sync/bridge-pkg/dist/index.js`. `bridge/props-map.json` is the durable
per-component props/roles input for `index.d.ts` + docs generation — update it
when component APIs change.

## Bridge facts (things that cost debugging time)

- Svelte components mount via `mount(Comp, { target, props, context: panoContext })`.
  `panoContext` (bridge `pano-context.js`) seeds every store AppLayout `setContext`s
  with demo data (user "Herobrine", server "CraftRealms Survival", dark theme).
- React-element props become snippets via `createRawSnippet` + React portals.
  **Legacy `<slot name="x">` needs `$$slots: {x: true}` in mount props** — the
  Svelte 5 `slot()` runtime then falls back to the same-named snippet prop.
  The wrapper builds that flag map automatically.
- The wrapper host div must NOT be `display:contents` — the render check measures
  root height and flags 0px.
- Modals: Bootstrap fixed positioning + body backdrop break inside preview cards.
  `previewOpen` prop forces `.modal` in-flow (`position:relative`, backdrop removed,
  re-applied on an interval so an imperative `show()` can't undo it). Module-context
  exports (`show`/`hide`) are attached as statics on the React wrapper.
- SDK `PluginManager.js` is stubbed (top-level `await import('path'|'url'|'adm-zip')`
  breaks the converter's es2020 target); node builtins + `adm-zip` alias to a CJS
  proxy shim; `@sveltejs/kit` has a minimal shim (error/redirect/fail).
- `@types/react` + `react` are symlinked into `bridge-pkg/node_modules` for ts-morph.
- Converter deps live in `.ds-sync/node_modules` (esbuild, ts-morph, react,
  esbuild-svelte, svelte@repo-version, playwright **1.60.0** — pinned to the
  machine's cached chromium-1223).

## Known render warns (triaged, benign)

- `[TOKENS_MISSING]` ~20 vars: `--bs-transparent-*`, `--bs-gray-*`,
  `--bs-nav-link-font-size`, etc. — Bootstrap emits per-theme vars only for its
  standard palette; the repo's custom `$theme-colors` entries (transparent, gray)
  reference vars Bootstrap never defines. Same unused selectors exist in the
  repo's own build (svelte-compile warns about `.text-transparent-emphasis`).
- CardHeader (and other `col-lg-*` layouts) stack vertically in preview cards —
  cards render narrower than the 992px `lg` breakpoint; correct responsive behavior.
- Floor-card `RENDER_BLANK`/`RENDER_THIN` on unauthored components: crash-prevention
  props render empty dark strips on the PanoSurface dark provider. Resolved as
  components get authored previews.

## Re-sync risks

- Demo data in `bridge/build-bridge.mjs` (`pano-context.js` seeds, shapes of
  session/user/server objects) mirrors AppLayout's `data` contract — if the
  backend/layout contract changes, previews silently render stale shapes.
- `props-map.json` was machine-generated from a one-time component scan
  (2026-07-05); new components get discovered by the glob but land with no
  props-map entry → d.ts falls back to slots-only. Regenerate or hand-add entries.
- Locale content comes from `lang/en-US.json` at bridge build time — key renames
  show up as raw i18n keys in previews.
- Playwright pin: cache `chromium-1223` ⇔ playwright 1.60.0. A system cache
  cleanup breaks validate; reinstall per §4.1.

## Wave-1 learnings (folded 2026-07-05)

- `isNode()` treats arrays as children ONLY if they contain a React element —
  string arrays (`accept={['image/*']}`) are Svelte props.
- Components using `$$props.class` need `{...({ class: 'x' } as any)}` in previews —
  React `className` is not mapped by the bridge.
- Modals keep state in module-level singleton stores — one mounted instance per
  sheet; two exports of the same modal would show last-`show()`-wins state.
  InstallingResourceModal success/error states are XHR/SSE-driven — statically
  unreachable; only the step-1 state is previewable (recorded as deliberate).
- `import.meta.env.VITE_*` is defined in the bridge esbuild `define`
  (API_URL=/api, PANO_WEBSITE_URL=https://panomc.com, …) — without it ApiUtil
  throws before fetch and `{website}` i18n placeholders render empty.
- Previews mock network by monkey-patching `window.fetch` inside the story
  (NotificationContainer.tsx is the reference implementation).
- `/api/profile/picture/*` and `{base}/assets/img/*` have no backend in cards →
  previews swap broken <img>s for data-URIs. Design agents should pass explicit
  image srcs (documented in conventions).
- `panoApiClient` is exported from the bundle so previews can register demo
  plugin views (Hook). ViewComponent demo pattern: pass
  `{ component: { default: (anchor, props) => { …; anchor.before(el); } } }`.
- language stores (`currentLanguage`, `Languages`), `PluginAPI.init()`, and
  `Chart.defaults.animation=false` are seeded by bridge `app-init.js`.
- `$app/stores`/`$app/state` page shims carry `data.user = demoUser (admin)` —
  template-level `hasPermission()` calls crash without it.
- Known render warn: `variants render identically` on ServerActivityMiniChart and
  WebsiteActivityChart — canvas line charts look near-identical at thumbnail
  scale despite different data; triaged benign.
