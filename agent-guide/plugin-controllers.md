# Plugin controllers

A controller holds the logic of a feature (cart, session, price format) as a plain JavaScript object, so a theme can
redraw the view and keep the behaviour. Views hold markup; controllers hold logic.

## Rules

1. One file per controller: `src/theme/controllers/<name>.js`, default export `defineController({...})` from
   `@panomc/plugin-kit/controller`. Files starting with `_`, sub-folders and `types.js` are private.
2. The name is camelCase and unique in the plugin; the public name is `<ns>/<name>` (`market/cart`: a slash, views use a
   colon). `version` is an integer of at least 1.
3. A controller imports no framework: no `svelte*`, no `@panomc/sdk*`, no `$app/*`. It reaches the world only through
   `c.host` (`request`, `session`, `onSession`, `locale`, `t`, `toast`, `storage`, `now`, `navigate`, `feature`,
   `loginUrl`, `registerUrl`).
4. `state` returns the initial state with every public key. Actions are plain functions; an expected failure returns
   `{ ok: false, code }`, it does not throw.
5. Removing or renaming a state or action key needs a higher `version`; `bun run build` fails otherwise. An added key only
   updates `pano-plugin.lock.json`.
6. In the plugin's own views: `plugin('<ns>').require('<name>')` from `@panomc/sdk/controllers` (throws when missing).
   A theme uses `plugin('<ns>').use('<name>')`, which returns `null` when the plugin is missing or the version differs:
   always guard it.
7. Keep the whole wrapper object (`cart.state.count`, `cart.actions.add()`); do not destructure `state` once.
8. A page takes its data from a controller with `export const view = { path: '/store', controller: 'store' }` and the
   controller's `load`.

## Verify

```sh
bunx pano-plugin check        # import rules: a controller importing svelte/store fails with the chain
bun run build                 # lock check of state and action keys
```

## Worked examples

| What                                       | File                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| An eager app-scope controller with `start` | `pano-web-platform/plugins/pano-plugin-market/src/theme/controllers/cart.js`                                                 |
| A page loader controller                   | `pano-web-platform/plugins/pano-plugin-market/src/theme/controllers/store.js`                                                |
| A theme page using a plugin controller     | `pano-showcase/theme-evori/src/views/market/ProductCard.svelte` with the pins in `pano-showcase/theme-evori/theme.config.js` |

Human docs: `theme-core/docs/CONTROLLERS.md`.
