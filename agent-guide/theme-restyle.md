# Restyling without touching markup

## Rules

1. Start in `src/styles/tokens.scss`: every variable of the engine SCSS is `!default`, your value wins. This alone makes
   a visibly different theme and costs nothing on engine or plugin updates.
2. Run-time values are the `--pano-*` custom properties (34 tokens; the list is
   `theme-core/packages/plugin-kit/src/styles/tokens.map.js`). Set them in your CSS, per palette if needed:
   `:root { --pano-color-primary: #7c3aed; --pano-radius: 0.5rem; }`
3. Plugin UI: write rules on the plugin's semantic classes (`<ns>-<view>__<part>`, for example
   `.market-product-card__title`). The plugin's own sheet sits in `@layer pano-plugin`, so your unlayered CSS wins
   without `!important`.
4. Engine UI: the same, on the engine's `pano-*` classes, or through the SCSS variables.
5. Put the rules in files imported by `src/styles/style.scss` (tokens first, then the engine SCSS, then yours). SCSS is
   compiled by `bun run build:ui` / `bun run dev:ui`, not by Vite: plain `bun run dev` does not pick up style edits.
6. Do not select on Bootstrap utility classes of a plugin view (`.col-lg-3`, `.d-flex`): they are not a contract. If the
   class you need is missing, the fix is in the plugin (`bunx pano-plugin classes` there), not a brittle selector here.
7. Do not copy a plugin's markup to change a colour. Eject only for structure (`theme-plugin-ui.md`).
8. In a bare theme, a CSS child combinator (`.a > .b`) does not match across the wrapper element the engine puts
   around each plugin's default view.
9. Text is restyled in `lang-overrides/<locale>.json`; a plugin's texts in `lang-overrides/plugins/<ns>/<locale>.json`.

## Verify

```sh
bun run build:ui
bunx @panomc/theme-core check --strict     # C13 styles against provides, C15 plugin lang overrides
```

Then look at `<your Pano address>/__pano/views` in every palette the theme ships.

## Worked examples

| What                                                        | File                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| Palette as variables, Bootstrap and `--pano-*` following it | `pano-showcase/theme-evori/src/styles/_evori-tokens.scss` |
| A whole plugin restyled through its semantic classes        | `pano-showcase/theme-evori/src/styles/_evori-store.scss`  |
| Tokens of an official theme                                 | `themes/vanilla-theme/src/styles/tokens.scss`             |

Human docs: `https://panomc.com/docs/theme/customization/`, `https://panomc.com/docs/handbook/theme/design/`.
