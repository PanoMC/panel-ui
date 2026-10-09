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
bun install                 # also runs postinstall → bundles the internal libs from the theme-core submodule
bun run dev                 # Vite dev on 0.0.0.0:3001 (DEV=true)
bun run dev:ui              # dev + a concurrent `sass --watch` (use this when touching SCSS)
bun run build               # production SSR build (DEV=false)
bun run build:ui            # one-shot SCSS → static/style.css
bun run lint                # prettier -c
bun run format              # prettier --write
```

## Key things to know

- **API base is `/api/v1/panel`**, proxied in dev to the backend via `VITE_API_URL=<origin>/api` in `.env`. The app
  is mounted under the `/panel` base path (see `svelte.config.js`). To run it against a local
  backend, set `init-ui = true` in the platform's `config.conf` and start both.
- The HTTP/data layer comes from `@panomc/sdk`, resolved from the **`theme-core` submodule**
  (`file:./theme-core/packages/sdk`, pinned per the parent commit) into `node_modules` by
  `bundle-internal-libs.js` on postinstall. To change the SDK, edit it in `theme-core/` and
  bump the submodule pointer, then re-run `bun run bundle:libs`.
- SCSS lives in `src/styles/`; Vite does **not** compile it — `watch:ui`/`build:ui` do. Run
  `dev:ui` (not plain `dev`) when editing styles.
- Routes are grouped as `(panel)` (the dashboard) and `(plugin-ui)` (slots where installed plugins
  mount panel UI). Components in `src/lib/components/`, pages in `src/lib/pages/`.
- Releases are automated by **semantic-release** on `alpha`/`beta`/`main`; use **conventional
  commit** messages. Production bundles are pinned by the backend in its `ui-releases.yml`.

Use Svelte 5 runes for new code; i18n via `svelte-i18n`'s `_` store.

<!-- pano-design-guidelines:start -->
## Panel design guidelines

Before designing or changing any panel UI (pages, components, modals, alerts, forms…), read
`design/README.md` and then **only** the topic file it points to for what you are building. These
rules are mandatory. Do not load every file in `design/`.
<!-- pano-design-guidelines:end -->

<!-- pano-agent-guide:start -->
## Agent guide

You are in a **Pano panel UI** repo. The panel is not themed and its pages are not named views; the guide matters here when you touch what plugins and the API share with the panel.

Read `agent-guide/README.md` first, then **only** the topic file it points to for your task. Decide from the
request and the code; ask only where the guide says a wrong guess is costly. `agent-guide/` is a synced copy: edit it
in `theme-core/agent-guide/` (repo `PanoMC/sdk`) and run `bun scripts/sync-agent-guide.js` there.

The three rules you will break first:

1. Core panel endpoints are `/api/v1/panel/...`; a plugin panel endpoint is `/api/plugins/<pluginId>/panel/...`, not below the panel base (`plugin-api.md`).
2. Lists are read from `items` and pages from `page`; errors from `error.code` (`plugin-api.md`).
3. Plugin panel pages are registered in code (`pano.ui.page.register`) and follow `design/README.md` (`plugin-panel-ui.md`).
<!-- pano-agent-guide:end -->
