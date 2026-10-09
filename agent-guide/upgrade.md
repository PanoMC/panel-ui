# Upgrading an old plugin or theme

"Old" means: a plugin on SDK 1 (views registered in code with `component`, API calls to `/api/...` strings) or a theme
that is a fork of vanilla-theme with its own `src/lib` and `src/routes`. Pano skips the site UI of a plugin that is not
built with SDK 2; there is no compatibility mode.

## Plugin: SDK 1 to SDK 2

1. `rollup.config.js` becomes the preset; add `@panomc/plugin-kit` to `devDependencies`:
   `import { panoPlugin } from '@panomc/plugin-kit/rollup'; export default panoPlugin();`
2. Views that are not under `src/theme/views` stay where they are: add `pano.plugin.js` with
   `export default { viewDirs: ['src/theme/pages', 'src/theme/components'] };`
3. Move every registration into its file: a page gets `export const view = { path: '/store' }`; a nav item, sidebar
   widget or hook gets `slot` / `sidebar` / `hook` with `id`.
4. Registrations that must stay in code (conditional ones) name the view: `{ ..., view: 'market:MarketProfileBlock' }`.
   An item with `component` and no `view` is dropped; the log names each one and the line to write.
5. API: declared Kotlin paths stay relative. Client calls go through `api` from `@panomc/sdk/plugin-api` with relative
   paths. `bunx @panomc/sdk pano-api migrate-v1` rewrites paths, error codes, validation imports, the api-level block of
   `build.gradle.kts`, client path literals and result reads; `--check` changes nothing and lists what is left.
6. Responses: lists under `items`, pages under `page`, errors as `{ error: { code } }` with declared codes. Fix every
   reader in the UI (`res.items`, not the old key).
7. Styles: look on `<ns>-...` classes; `<style>` blocks under the scope rule (`plugin-views.md` rule 8).
8. Run `bunx pano-plugin check`. A view that imports plugin code which is not a helper, or uses `getContext`, is named
   with file, line and fix. Move that logic into controllers one at a time (`plugin-controllers.md`).
   `PANO_VIEW_IMPORTS=warn` turns those errors into warnings while you migrate; a package built that way cannot be
   ejected by a theme, so do not release with it.
9. External addresses change with the paths: payment return and webhook URLs, OAuth redirect URIs. List them for the
   person; there is no alias.

No change is needed on the Kotlin side beyond step 5 and 6, and none in the panel UI beyond the API calls.

## Theme: a vanilla fork to theme-core

1. Add `@panomc/theme-core`; take the `package.json` scripts, config factories, hooks shims and `theme.config.js` of
   `themes/vanilla-theme`.
2. Delete the fork's `src/lib` (keep nothing but generated artifacts), `src/routes` and `scripts/`; run
   `bunx @panomc/theme-core sync`.
3. Move the fork's look into `src/styles/tokens.scss` and into view overrides (`eject-view <Name>`, then bring the old
   markup onto the documented props). Text changes go to `lang-overrides/`.
4. `bunx @panomc/theme-core check`, build, and load it once in a Pano.

## Theme: already on theme-core, new engine version

```sh
bun update @panomc/theme-core && bunx @panomc/theme-core sync && bunx @panomc/theme-core check && bun run build
```

`sync` prints the plugin views whose contract changed. Update each overridden one: `eject-view <id>` (writes
`<file>.new`), merge, `accept <id>`. A theme entry of the old function form keeps working (contract 1).

The official themes take the engine as a git submodule (`theme-core/`) with `file:` dependencies: the update there is a
submodule bump followed by the same `sync`, `check`, `build`.

## Worked examples

All official plugins and the five official themes are migrated: compare with `pano-web-platform/plugins/pano-plugin-faq`
(small) and `themes/blaze-theme` (a fork with 18 engine views overridden).

Human docs: `theme-core/docs/MIGRATION.md`.
