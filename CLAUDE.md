# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`panel-ui` is the **admin/management dashboard** for the Pano platform — the web UI a site owner
uses to manage news, users, plugins, themes, and settings (~56 routes). It is a **SvelteKit 2 +
Svelte 5** app built with **Vite** and shipped via **`@sveltejs/adapter-node`**, and is **not served
on its own in production**: the `pano-web-platform` backend launches it as a Node/Bun upstream and
reverse-proxies to it (see the ecosystem overview in `../CLAUDE.md` and the backend's
`UIManager` in `../pano-web-platform/CLAUDE.md`).

Code is **JavaScript with JSDoc** (no `.ts`), styling is **SCSS compiled separately from Vite**, and
the package manager is **Bun**.

## Commands

```bash
bun install                 # also runs postinstall → bundles the local @panomc/sdk (src/pano-sdk)
bun run dev                 # Vite dev on 0.0.0.0:3001 (DEV=true)
bun run dev:ui              # dev + a concurrent `sass --watch` (use this when touching SCSS)
bun run build               # production SSR build (DEV=false)
bun run build:ui            # one-shot SCSS → static/style.css
bun run lint                # prettier -c
bun run format              # prettier --write
```

## Key things to know

- **API base is `/panel/api`**, proxied in dev to the backend via `VITE_API_URL` in `.env`. The app
  is mounted under the `/panel` base path (see `svelte.config.js`). To run it against a local
  backend, set `init-ui = true` in the platform's `config.conf` and start both.
- The HTTP/data layer comes from a **vendored `@panomc/sdk`** at `src/pano-sdk`, bundled into
  `node_modules` by `scripts/bundle-internal-libs.js` on postinstall — edit the SDK there, then
  re-run `bun run bundle:libs`.
- SCSS lives in `src/styles/`; Vite does **not** compile it — `watch:ui`/`build:ui` do. Run
  `dev:ui` (not plain `dev`) when editing styles.
- Routes are grouped as `(panel)` (the dashboard) and `(plugin-ui)` (slots where installed plugins
  mount panel UI). Components in `src/lib/components/`, pages in `src/lib/pages/`.
- Releases are automated by **semantic-release** on `alpha`/`beta`/`main`; use **conventional
  commit** messages. Production bundles are pinned by the backend in its `ui-releases.yml`.

Use Svelte 5 runes for new code; i18n via `svelte-i18n`'s `_` store.
