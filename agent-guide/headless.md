# A headless front-end

A site that is not a theme: it talks to Pano over the API and draws everything itself. The official start is
`pano-starter-sveltekit` (SvelteKit 2, Svelte 5, `adapter-node`, Bun, JavaScript with JSDoc; no Bootstrap, no theme-core).

## Decide

| Decision                   | Default                                                                                             | Read it from                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is headless needed at all? | no: a theme (`theme-new.md`)                                                                        | the request asks for another framework, another host or full control of the server                                                                                                           |
| Where it runs              | custom app: Pano runs the zip on its own origin                                                     | ask only if the request does not say and hosting matters: custom app (Bun only, zero setup), external upstream (Pano proxies to your server, any runtime), own origin (a separate host name) |
| How sessions travel        | BFF: the server calls Pano with a front-end key and keeps the session token in an `HttpOnly` cookie | direct browser calls are possible only from an allowed origin on the same registrable domain as Pano                                                                                         |
| Auth and system pages      | Pano's built-in fallback pages (activation, password reset, OAuth return, 2FA, payment return)      | the front-end takes one over by listing its address under `urls` in `manifest.json`                                                                                                          |

## Rules

1. Start from the starter: `bunx @panomc/client-gen new <dir> [--url <pano>]` or copy `pano-starter-sveltekit`. Do not
   start from a theme.
2. Core is `/api/v1/...`; a plugin is `/api/plugins/<pluginId>/...`. Never call `/api/v1/panel/...` from a site: it is
   internal and has no stability promise.
3. The typed client under `src/lib/pano/` is generated, never edited: `bun run pano:pull` (`pano-client pull`
   through `pano-starter-sveltekit/scripts/pano-client.mjs`) writes the core operations and, per active plugin, its operations, types and served controllers.
4. Every mutation carries the CSRF token. The front-end key identifies the server and forwards the visitor IP; it cannot
   sign a user in without the password, captcha and 2FA steps.
5. Server-to-Pano calls use the global `fetch`, never SvelteKit's `event.fetch` (a site served on Pano's origin would
   call itself).
6. Lists are `{ items }` (+ `{ page }` when paged); errors are `{ error: { code } }`. Branch on `error.code`, never on
   the message or the HTTP text.
7. Plugin logic comes from the plugin's compiled controllers (`controllers.mjs`, pulled by `pano:pull`) with a fetch
   host; plugin UI comes as web components (`<pano-market-goal>`) through Pano's widget loader, from an allowed origin.
8. A custom app is a zip of `manifest.json` (`"type": "custom-app"`, `apiLevel`, `urls`), `index.js` listening on `PORT`
   / `HOST`, and `build/`. Custom front-ends are not distributed through the store.
9. JavaScript with JSDoc; the generated client is JS too.

## Steps

```sh
bun install && cp .env.example .env    # API_URL, PANO_FRONTEND_KEY (Panel -> Appearance -> Front-end -> Front-end keys)
bun run pano:pull                      # against your running Pano
bun run dev
bun run check                          # svelte-check + pano-client check (exits 1 when the client is out of date)
bun test && bun run build
bun run package                        # the custom-app zip
```

## Worked examples

| What                               | File                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| Session cookie, client per request | `pano-starter-sveltekit/src/hooks.server.js`, `pano-starter-sveltekit/src/lib/server/pano.js`     |
| Login with 2FA / captcha steps     | `pano-starter-sveltekit/src/lib/server/auth-flow.js`, `pano-starter-sveltekit/src/routes/(auth)/` |
| The URL map of a custom app        | `pano-starter-sveltekit/manifest.json`                                                            |
| Widgets on a page                  | `pano-starter-sveltekit/src/lib/pano/widgets.js`                                                  |
| A full site, the twin of a theme   | `pano-showcase/headless/`                                                                         |

Not built: the `publish-controllers` command of `pano-plugin` (npm publishing of a plugin's controllers); pull them from a running Pano.

Human docs: `pano-starter-sveltekit/README.md`, `https://panomc.com/docs/integration/headless/`,
`https://panomc.com/docs/integration/access/`, `https://panomc.com/docs/integration/client/`,
`https://panomc.com/docs/integration/widgets/`.
