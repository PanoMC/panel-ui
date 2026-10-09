# Adding a block or widget to a page

A block is a plugin view a theme places itself. A widget is a plugin view compiled as a web component for pages
outside a theme (`headless.md`).

## Decide

| Decision                     | Default               | Read it from                                                                                                  |
| ---------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Is there a view for it?      | use an existing one   | `bunx @panomc/theme-core list-views`, or `theme-core/docs/PLUGIN-VIEWS.md` section 8 for the official plugins |
| The plugin has no such view  | stop                  | a new block is a plugin change (`plugin-views.md`, `block: true`); a theme cannot invent plugin data          |
| Keep the automatic copy too? | no, placing claims it | set `claims: { "<id>": false }` in `theme.config.js` to keep both                                             |

## Rules

1. Place it in your own markup (a page of the theme or an overridden view):

```svelte
<script>
  import { PluginBlock } from "@panomc/sdk/components/theme";
</script>
<PluginBlock id="market:GoalWidget" />
```

2. Props are literals only: the data of a block loads per placement on the server (C7 warns otherwise).
3. An unknown id or a plugin that is not installed renders nothing, or the `fallback` snippet. Never wrap a block in a
   check for the plugin yourself (a different layout or call when a plugin is installed is `hasPlugin`, `theme-plugin-ui.md`).
4. Placing a view that the plugin also mounts by itself (nav item, sidebar widget, hook) **claims** it: the automatic
   copy is dropped. `claims` in `theme.config.js` sets it by hand; an explicit entry wins.
5. A view that is neither `block: true` nor an injection is not meant for placement: eject the page that holds it.
6. Blocks of the official plugins: market `GoalWidget`, `NavCart`, `StatsWidget`, `RecentBuyersWidget`,
   `TopSupportersWidget`; countdown-timer `CountdownTimerCover`, `CountdownTimerSidebar`; comments `ThemePostComments`;
   faq `SupportFAQWrapper`.

## Verify

```sh
bunx @panomc/theme-core check --strict     # C7 ids exist and props are literal, C8 lists the claims
```

## Worked examples

| What                                      | File                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| The cart placed in a theme's own menu bar | `pano-showcase/theme/src/views/Navbar.svelte`                                        |
| Two market widgets on a landing page      | `pano-showcase/theme-evori/src/pages/Landing.svelte`                                 |
| The plugin side of a block                | `pano-web-platform/plugins/pano-plugin-faq/src/theme/views/SupportFAQWrapper.svelte` |

## Known rough edges

- A claim is global: placing `market:TopSupportersWidget` on the home page removes it from every sidebar. There is no
  per-page claim. To show it in both places, set its claim to `false` and accept the automatic positions.
- The market plugin has no product-grid block. Examples that show `<PluginBlock id="market:ProductGrid" ... />` (a comment
  in the SDK, a snippet in the website docs) describe the syntax, not an existing view. A product grid on a landing page
  is drawn by the theme from the plugin's controllers (`plugin('market').use(...)`), or added to the market plugin first.

Human docs: `theme-core/docs/PLUGIN-VIEWS.md` section 5, `https://panomc.com/docs/theme/views/`.
