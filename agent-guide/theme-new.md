# Making a new theme

A theme is a small repo that depends on `@panomc/theme-core`. Never fork vanilla-theme or copy another theme.

## Decide

| Decision                | Default                                        | Read it from                                                                                                              |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap kept or bare? | kept (plugin default views are written for it) | ask only if the request brings its own CSS framework or design system and does not say: `--bare` cannot be undone cheaply |
| Home page               | the posts feed, no `home` key                  | the request describes a landing or a store-first site: `home` in `theme.config.js` (`theme-routes-home.md`)               |
| How far to go per view  | tokens only                                    | a different look: tokens + CSS (`theme-restyle.md`); a different structure: eject that view (`theme-override-view.md`)    |
| Plugin UI               | left on the plugin's default                   | per plugin, follow the ladder in `theme-plugin-ui.md`                                                                     |

## Rules

1. Scaffold: `bunx @panomc/theme-core new <kebab-name> [--local] [--bare]`. With a name it asks nothing and does not
   install: run `bun install` in the folder (the first install generates routes, language files and bridges).
2. `manifest.json` `id` is the theme's own; `vanilla-theme` is reserved.
3. `svelte` in `package.json` is pinned exactly to the engine's version. Never loosen it.
4. Generated, never edit: `src/routes/`, `src/lib/`, `lang/`, `src/hooks.*.js`, `plugin-contracts/` (commit it),
   `core-meta.json` values written by the build. Regenerate with `bunx @panomc/theme-core sync`.
5. Yours: `manifest.json`, `theme.config.js`, `src/styles/tokens.scss`, `src/styles/style.scss`, `src/views/`,
   `src/pages/`, `lang-overrides/`, `static/`.
6. Work down the tiers and stop at the first that is enough: tokens, then CSS on semantic classes, then view overrides,
   then routes / home pages.
7. A bare theme declares `provides: { bootstrap: false, fontawesome: false }` and sets the `--pano-*` tokens in its own
   CSS; the engine then links a scoped fallback sheet for every default plugin view it did not override.
8. Text changes go to `lang-overrides/<locale>.json` (only the keys you change; additive).
9. `bunx @panomc/theme-core check --strict` must pass before packaging; `package` runs it again.

## Steps

```sh
bunx @panomc/theme-core new my-theme
cd my-theme && bun install && bun run dev:ui   # prints the panel field to set once (Theme dev server), Development Mode on
# edit src/styles/tokens.scss; open <your Pano address>/__pano/views for every view with sample data
bunx @panomc/theme-core check --strict
bun run build && bunx @panomc/theme-core package
```

## Worked examples

| What                                                                 | File                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A theme that overrides nothing                                       | `themes/vanilla-theme/theme.config.js`                                                                        |
| A Bootstrap theme with its own shell, a landing and two market views | `pano-showcase/theme-evori/` (`theme.config.js`, `src/styles/_evori-tokens.scss`, `src/pages/Landing.svelte`) |
| A bare theme with every view redrawn                                 | `pano-showcase/theme/`                                                                                        |
| A fork with settings keys of its own                                 | `themes/blaze-theme/theme.config.js` (`settingsSchema`)                                                       |

## Known rough edges

- `vite dev` of a theme that sits inside a Bun workspace does not hydrate (the page renders, nothing reacts). Develop
  such a theme from a standalone folder or test it from a build.
- The scaffold assumes a standalone folder; inside a workspace check the `file:` dependencies and `overrides` by hand.
- While the engine is not on npm, `--local` is the default (`file:` links, `bunfig.toml` with the hoisted linker).
- The bare fallback sheet needs Chrome 118, Safari 17.4 or Firefox 146.

Human docs: `theme-core/docs/QUICKSTART-THEME.md`, `theme-core/docs/THEME-AUTHOR-GUIDE.md`,
`https://panomc.com/docs/handbook/theme/`.
