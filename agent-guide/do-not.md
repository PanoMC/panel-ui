# Do not

Each line is something an agent has done or is likely to do. The file to read instead is in brackets.

## Everywhere

- Do not write TypeScript, `.d.ts` files or `lang="ts"`. JavaScript with JSDoc only.
- Do not bump a version, create a tag or edit a changelog. Do not push or open a pull request unless asked.
- Do not write a commit message with a body or trailers where the repo uses one-line conventional commits.
- Do not edit generated files: a theme's `src/routes/`, `src/lib/`, `lang/`, `plugin-contracts/`; a plugin's
  `src/main/resources/plugin-ui/`, `pano-plugin.lock.json`; a headless site's `src/lib/pano/`; any `build/`.
- Do not edit a synced copy of `design/` or `agent-guide/`; change the source (`panel-ui/design/`,
  `theme-core/agent-guide/`) and run its sync script.
- Do not change the pinned `svelte` version of a theme, and do not declare `svelte` in a plugin.
- Do not use npm, pnpm or a system `gradle`: Bun and `./gradlew`.
- Do not write `panocms`; the domain is `panomc.com`, the GitHub organisation `PanoMC`.

## Plugin

- Do not register a site view in code with `component`; name it (`view: '<ns>:<Name>'`) or describe it in the file. [`plugin-views.md`]
- Do not write `/api`, `/v1`, the plugin id or `panel` into a declared Kotlin path, and do not hard-code an
  `/api/plugins/...` string in the UI. [`plugin-api.md`]
- Do not answer a list under a key of your own, invent a second error shape, or derive an error code from a class name. [`plugin-api.md`]
- Do not put a page-level `<style>` that leaks: no `:global`, no selector without the `.<ns>-` class, no `var(--bs-*)`. [`plugin-views.md`]
- Do not put business logic in a view, and do not import Svelte or the SDK in a controller. [`plugin-controllers.md`]
- Do not use `getContext` / `setContext` or a top-level `onDestroy` in a site view.
- Do not design a default view for a theme other than vanilla: the default is vanilla's look.
- Do not change a prop, slot or hook of a released view, or a key of a released controller, without raising its version.
- Do not remove or rename a field or path of a released plugin API.
- Do not write to a core table from a plugin.
- Do not hand-edit `pano-boilerplate-plugin` to add a feature; change the template in
  `theme-core/packages/plugin-kit/bin/templates/plugin/`.

## Theme

- Do not fork vanilla-theme or copy a theme's `src/lib`; scaffold with `theme-core new`. [`theme-new.md`]
- Do not eject a view to change a colour or a margin. [`theme-plugin-ui.md`]
- Do not write an override from scratch, guess a `contract` number or drop a `<PluginSlot>` / `<Hook>` / root class. [`theme-override-view.md`]
- Do not export `load` from an override, fetch plugin data in a theme, or copy plugin logic into a theme: use the
  plugin's controllers, or stop and say the plugin needs the change.
- Do not import a file from a plugin's source into a theme; reference views as `pluginView("<ns>:<Name>")` and place them
  with `<PluginBlock>`.
- Do not select on a plugin's Bootstrap utility classes. [`theme-restyle.md`]
- Do not add, edit or delete a file under `src/routes/` to add, rename or remove a page. [`theme-routes-home.md`]
- Do not hard-code a link to a renamed path; write `route("/canonical")`.
- Do not use `--bare` unless a theme without Bootstrap was asked for.
- Do not vite-proxy `/plugins` in a theme's dev config: the theme serves it itself and the proxy loops.

## Headless

- Do not call `/api/v1/panel/...` from a site, and do not put the front-end key or the session token where browser
  JavaScript can read it. [`headless.md`]
- Do not edit the generated client; pull it again.
- Do not branch on error messages; branch on `error.code`.

## Panel

- Do not design a panel screen without reading `design/README.md` and its topic file. [`plugin-panel-ui.md`]
- Do not try to make panel pages overridable by themes: the panel is out of scope of the view model.
