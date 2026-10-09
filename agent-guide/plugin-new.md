# Making a new plugin

## Decide

| Decision                  | Default                                                                      | Read it from                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site pages or parts?      | one page (what the scaffold writes)                                          | the request names a page, widget, nav item: views under `src/theme/views/` (`plugin-views.md`)                                                                      |
| Panel pages?              | none                                                                         | the request says the admin manages or configures something: `src/main.js` + `src/panel/` (`plugin-panel-ui.md`) and panel endpoints                                 |
| API only?                 | no                                                                           | no UI is asked for: only Kotlin `@Endpoint` classes (`plugin-api.md`); delete the scaffolded page                                                                   |
| Own data?                 | none                                                                         | something must be stored: the plugin's own tables, DAOs and migrations; never a core table                                                                          |
| Public or private / paid? | free and open (the scaffold default: `pluginFreemium=false`, no license key) | ask only if the request hints at selling it and does not say how: the choice sets the license wiring in `gradle.properties` and whether the source may be published |

## Rules

1. Scaffold, do not copy another plugin. Run inside Pano's `plugins/` folder; the folder name is the plugin id:
   `cd <pano>/plugins && bunx @panomc/plugin-kit new <id> [--package x.y] [--local <dir>]` (`<dir>` = a theme-core checkout)
2. The scaffold is the template in `theme-core/packages/plugin-kit/bin/templates/plugin/`. `pano-boilerplate-plugin` is its
   committed output: read it as the worked example, do not hand-edit it to add features.
3. The plugin id is `pluginId` in `gradle.properties`. The view namespace is the id without a leading `pano-plugin-`
   (`pano-plugin-market` gives `market`); set `namespace` in `pano.plugin.js` only to resolve a clash.
4. `rollup.config.js` is the preset and nothing else unless the plugin needs it:
   `import { panoPlugin } from '@panomc/plugin-kit/rollup'; export default panoPlugin();`
5. Do not declare `svelte` in the plugin's `package.json`: the SDK pins it and the build checks the pair.
6. Commit `pano-plugin.lock.json` (the build writes it). Never edit `src/main/resources/plugin-ui/` (build output).
7. Texts live in `src/main/resources/locales/<locale>.json`, keyed `plugins.<pluginId>.<key>`.

## Steps

```sh
cd <pano>/plugins && bunx @panomc/plugin-kit new my-plugin
cd my-plugin && bun run dev       # pano-plugin dev: builds the jar once, then watches the UI
# restart Pano once (Development Mode on), open /my-plugin
bun run check                     # pano-plugin check
./gradlew build                   # jar with the UI; -Pnoui skips the UI build
```

## Worked examples

| What                                                     | File                                                                                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| The smallest plugin                                      | `pano-boilerplate-plugin/` (`src/theme/views/HelloPage.svelte`, `src/main/kotlin/com/panomc/plugins/boilerplate/routes/GetHelloAPI.kt`) |
| A small plugin with site view, panel pages and endpoints | `pano-web-platform/plugins/pano-plugin-faq/`                                                                                            |
| The full one (70 views, controllers, slots, samples)     | `pano-web-platform/plugins/pano-plugin-market/`                                                                                         |

## Known rough edges

- The scaffold assumes a standalone folder inside Pano's `plugins/`. Inside another workspace or tree, check the
  `file:` dependencies and `panoPluginsDir` in `gradle.properties` by hand.
- While the kit is not on npm, `--local <dir>` is the default and writes `file:` dependencies; Gradle needs
  `PANO_SDK_DIR=<theme-core>/packages/sdk`.
- `gradle.properties` carries `apiLevel=1` while the pinned Pano dependency has no API level (`release.md`).
- The `publish-controllers` command of `pano-plugin` is not available yet.

Human docs: `theme-core/docs/QUICKSTART-PLUGIN.md`, `https://panomc.com/docs/handbook/addon/`.
