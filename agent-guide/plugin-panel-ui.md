# Plugin panel UI

The panel side of a plugin did not change with the open front-end: it is registered in code, it is not a named view and
no theme can override it.

## Rules

1. Read `design/README.md` in the plugin repo first, then only the design topic for what you build (alerts, modals,
   tables, cards). Those rules are mandatory for every panel screen.
2. Register in `src/main.js`, inside `if (pano.isPanel) { ... }`:
   - a page: `pano.ui.page.register({ path: '/faq', component: viewComponent(() => import('./panel/pages/FAQPage.svelte')) })`
     (`viewComponent` from `@panomc/sdk/utils/component`);
   - a part of the plugin detail page: `pano.ui.hook.register({ name: 'panel:plugin-detail:content:<pluginId>', component, permission })`;
   - a navigation entry: `pano.ui.nav.site.editNavLinks((items) => [...])`.
3. Panel files live under `src/panel/` (`pages/`, `components/`). They are not under a view folder and carry no
   `export const view`.
4. Panel data comes from panel endpoints through `api.panel.get / post / put / delete({ path: '/relative' })` from
   `@panomc/sdk/plugin-api` (`plugin-api.md`). The address is `/api/plugins/<pluginId>/panel/...`, not below
   `/api/v1/panel`.
5. Guard every page and endpoint with a permission (`pano.plugin.<pluginId>....`), declared on the Kotlin side.
6. Texts: `plugins.<pluginId>.<key>` in `src/main/resources/locales/`; add every key in every locale file the plugin has.
7. Panel components may use Bootstrap freely; the semantic-class and `<style>` rules of site views do not apply here.

## Verify

```sh
bun run build          # or `bun run dev` with Pano in Development Mode; open the panel page
```

Market has its own gates on top: `bun run check:panel` in `pano-web-platform/plugins/pano-plugin-market`.

## Worked examples

| What                                                      | File                                                                       |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Pages, hook, navigation in one file                       | `pano-web-platform/plugins/pano-plugin-faq/src/main.js`                    |
| A list page with modals                                   | `pano-web-platform/plugins/pano-plugin-faq/src/panel/pages/FAQPage.svelte` |
| A large panel split into `register.js`, pages and layouts | `pano-web-platform/plugins/pano-plugin-market/src/panel/register.js`       |

Human docs: `https://panomc.com/docs/addon/panel-ui/`.
