# Overriding a view in a theme

Engine views (`Navbar`, `LoginView`) and plugin views (`market:ProductCard`) are overridden the same way.

## Rules

1. Never write an override from scratch. Eject, then edit:
   `bunx @panomc/theme-core eject-view Navbar` or `bunx @panomc/theme-core eject-view market:ProductCard`
   (`'market:*' --pages` ejects a plugin's pages). The command copies the readable default into `src/views/` (plugin views
   into `src/views/<ns>/`, helpers into `src/views/<ns>/_lib/`) and writes the entry in `theme.config.js`.
2. The entry is `Name: () => import(...)` (contract 1) or
   `"<ns>:<Name>": { contract, controllers: [...], component: () => import(...) }`. Let `eject-view`, `accept` and
   `check --fix` write `contract` and the controller pins; do not guess them.
3. Keep every `<PluginSlot>`, `<ViewComponent>` slot and `<Hook>` of the default (rule C4, an error): dropping one makes
   installed plugins disappear without a message.
4. Keep the root semantic class of the view (C14), so restyle rules and the fallback sheet still apply.
5. An override supplies markup only. Data stays with the plugin: a `load` exported by an override is ignored (C11).
   Read only props that are in the contract (C6); the header of the ejected file lists them.
6. Another plugin view inside an override is referenced as `pluginView("<ns>:<Name>")`, not imported from the plugin.
7. Logic comes from controllers: `plugin('<ns>').use('<name>')` from `@panomc/sdk/controllers`; it returns `null` when the
   plugin is missing or the version differs, so guard it. Pins live under `controllers` in `theme.config.js`.
8. Write links as `href={route("/store")}` (`route` from `$pano/registry/index.js`) so renamed routes are followed.
9. An overridden `MainLayoutView` must not emit `<meta name="description">`.
10. When the plugin raises the contract, the default renders and the panel warns until you update: `eject-view <id>`
    again (writes `<file>.new`), merge, `bunx @panomc/theme-core accept <id>`.

## Verify

```sh
bunx @panomc/theme-core list-views         # the override is marked
bunx @panomc/theme-core check --strict     # C1 to C7, C11, C12, C14
bunx @panomc/theme-core check --fix        # writes missing or outdated controller pins
```

## Worked examples

| What                                  | File                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Engine views overridden by a fork     | `themes/blaze-theme/theme.config.js`, `themes/blaze-theme/src/views/`                      |
| Two market views with controller pins | `pano-showcase/theme-evori/theme.config.js`, `pano-showcase/theme-evori/src/views/market/` |
| Every view overridden, no Bootstrap   | `pano-showcase/theme/theme.config.js`, `pano-showcase/theme/src/views/`                    |

## Known rough edges

- `check --strict` fails on a freshly ejected plugin view: the check reads every `$_(` under `src/views` as a theme key,
  and an ejected view calls the plugin's texts `$_`. Rename that store variable in the ejected file (theme-evori names it
  `mt`).
- An entry in `theme.config.js` that points at a missing file answers 500 on every page that uses the view, without
  naming it. `check` (C1) names it: run it before you look anywhere else.
- A plugin built with `PANO_VIEW_IMPORTS=warn` cannot be ejected; update the plugin.

Human docs: `theme-core/docs/PLUGIN-VIEWS.md` sections 4 and 7, `https://panomc.com/docs/theme/views/`.
