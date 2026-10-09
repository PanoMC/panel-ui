# Adding a page or a view to a plugin

A plugin's site UI is a set of named views. One `.svelte` file is one view; there is no registration code.

## Rules

1. Put the file under a view folder: `src/theme/views/` by default, or the folders listed as `viewDirs` in
   `pano.plugin.js` (market uses `src/theme/pages` and `src/theme/components`).
2. The file name is the view name and matches `[A-Z][A-Za-z0-9]*`. The id is `<ns>:<Name>` (`market:ProductCard`). No two
   files with the same name.
3. Describe the view in the file, with literals only (it is parsed, never run):
   `<script module>export const view = { path: '/x' };</script>`
   - a page: `path` (plus `layout`, `permission`, `loginRequired`, `controller`, `home: { label }`);
   - an injection: `slot`, `hook` or `sidebar`, with `id` and `priority`;
   - a block a theme places: `block: true`; a web component: `widget`.
4. `contract` (integer, default 1) is the version of the view's props, slots and hooks. Removing a prop, adding a required
   prop or changing slots / hooks needs a higher `contract`; `bun run build` fails with the line to write. A new optional
   prop needs nothing.
5. A view imports only `svelte*`, `svelte-i18n`, `@panomc/sdk*`, other views and view helpers (relative `.js` files outside
   `src/theme/controllers/`). Logic that must stay closed or be reused goes into a controller (`plugin-controllers.md`).
6. A view never calls `setContext`, `getContext` or `hasContext`. Take the value as a prop or read host data through
   `@panomc/sdk`.
7. Avoid top-level `onDestroy` in a view (it breaks server rendering of plugin views); return the cleanup from `onMount`
   or an `$effect`.
8. Look: semantic classes `<ns>-<view>__<part>` on every structural element. A `<style>` block is allowed only when every
   selector starts with a class `.<ns>-...`, with no `:global`; keyframes and custom properties are named `<ns>-...`.
   Read theme values through `var(--pano-*)`, never `var(--bs-*)`. A run-time class or a `style=` attribute needs
   `styles.dynamicClassAllow` / `styles.styleAttrAllow` in `pano.plugin.js`.
9. Registrations left in code (conditional ones) name the view: `pano.ui.page.register({ path: '/faq', view: 'faq:FAQPage' })`.
   The form with `component` and no `view` is dropped on the site side.
10. Give every page and block view a samples file with the states `empty`, `filled`, `error`, `loading` (list the states
    the view does not have in `notApplicable`). `bunx pano-plugin samples <View>` writes the stub.
11. A view that opens a slot for other plugins uses `<PluginSlot id="<ns>:<slot>" />` from `@panomc/sdk/components/theme`;
    slot ids stay inside the plugin's own namespace.

## Steps

```sh
# 1. write src/theme/views/X.svelte with `export const view = {...}`
bunx pano-plugin samples X          # 2. writes X.samples.js; fill the states
bunx pano-plugin classes            # 3. lists structural elements without a semantic class (--fix writes them)
bunx pano-plugin check --strict     # 4. views, imports, lock, styles, samples, API paths
bun run build                       # 5. updates pano-plugin.lock.json: commit it
```

See the result in a running theme at `<your Pano address>/__pano/views` (Development Mode).

## Worked examples

| What                                      | File                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| A page with its own `load`                | `pano-boilerplate-plugin/src/theme/views/HelloPage.svelte`                                    |
| A page whose data comes from a controller | `pano-web-platform/plugins/pano-plugin-market/src/theme/pages/StorePage.svelte`               |
| A sidebar injection that is also a widget | `pano-web-platform/plugins/pano-plugin-market/src/theme/components/widgets/GoalWidget.svelte` |
| A block (`block: true`)                   | `pano-web-platform/plugins/pano-plugin-faq/src/theme/views/SupportFAQWrapper.svelte`          |
| A view that opens slots                   | `pano-web-platform/plugins/pano-plugin-market/src/theme/pages/CheckoutPage.svelte`            |
| Samples                                   | `pano-web-platform/plugins/pano-plugin-faq/src/theme/views/FAQPage.samples.js`                |
| Plugin options (`viewDirs`, `styles`)     | `pano-web-platform/plugins/pano-plugin-market/pano.plugin.js`                                 |

Design the default view for vanilla-theme (Bootstrap markup plus the semantic classes): vanilla overrides no plugin view,
so the default IS its look.

Human docs: `theme-core/docs/PLUGIN-VIEWS.md`, `https://panomc.com/docs/addon/theme-ui/`.
