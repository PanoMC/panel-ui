# Changing how a plugin's view looks in a theme

A plugin draws its own default views in the vanilla look. A theme chooses per view how far it goes. Take the cheapest
step that gives what was asked.

## Decide

Read the request and the view first: `bunx @panomc/theme-core list-views` shows every view id, its contract and whether
the theme overrides it; `<your Pano address>/__pano/views` shows each one with sample data; the readable default source
is in the plugin package (`contract/src/`) and, for an open plugin, in its repo.

| Step | The request is about                                                | Do                                                                                                                                      | Cost                                                                               |
| ---- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1    | colours, spacing, radius, typography                                | restyle: `--pano-*` tokens and rules on the plugin's semantic classes; no eject (`theme-restyle.md`)                                    | none on plugin updates                                                             |
| 2    | markup or structure (order of parts, other elements, parts removed) | eject the view: `eject-view <ns>:<View>`; keep its slots and root class (`theme-override-view.md`)                                      | you maintain that file; a contract bump falls back to the default until you update |
| 3    | the piece should sit on another page or place                       | place it with `<PluginBlock id="<ns>:<View>" />` (`theme-blocks.md`)                                                                    | the claim is global: the automatic copy disappears everywhere                      |
| 4    | data or behaviour the view does not receive                         | stop: that is the plugin's controller or API, not the theme. Say so and name the plugin file (`plugin-controllers.md`, `plugin-api.md`) | a plugin change and release                                                        |

Default when the request does not say: step 1. Go to step 2 only when the wanted result cannot be reached with CSS
(a different DOM order is a structure change; a hidden part or a different grid is not).

Ask only if the request reads both ways ("make the product card look like this mock") and step 1 would visibly miss it:
"Restyle with CSS (survives plugin updates) or redraw the markup (you maintain the file)? I will restyle unless you say."

Scope, read from the theme before you finish:

- Which plugins: the views you touched belong to the plugins in `plugin-contracts/`; a plugin that is not installed
  renders nothing and is never an error.
- Which palettes and widths: check every colour mode the theme ships (light and dark at least) at desktop and phone width.
- A rule written on a semantic class applies to every theme page that shows the view, the block placements included.

## When the behaviour depends on a plugin being installed

"If plugin X is installed do this, otherwise that" (a menu entry, a landing section, a call to the plugin's API):

- Import `hasPlugin(siteInfo, idOrNamespace)` from `$pano/lib/plugins.js` and pass `session.siteInfo`: in a `load()` it
  comes from `(await parent()).session`, in a component from `getContext("session")` (`$session.siteInfo`). The full plugin id
  (`pano-plugin-market`) is canonical, the namespace (`market`) works too. `pluginInfo(siteInfo, id)` returns
  `{ version, uiHash, dependencies }` or `null`. Do not copy the five-line function into the theme and do not read
  `siteInfo.plugins` by hand.
- Show a block or a fallback instead: `<PluginBlock id="..."> {#snippet fallback()}...{/snippet} </PluginBlock>`
  (`theme-blocks.md`); that needs no check.
- Never call a plugin's API or controller, or link to its page, without the check. Overridden views and plugin CSS need
  no guard: unused when the plugin is missing.

## What happens when the plugin changes

- The plugin raises a view's `contract`: the registry shows the plugin's default view instead of your override, the panel
  lists it (`CONTRACT_MISMATCH`) and the theme is marked `OUTDATED`. The site never breaks and the plugin update is never
  blocked.
- A controller your override pins changes version: the same, as `CONTROLLER_MISMATCH`.
- Update: `bunx @panomc/theme-core eject-view <id>` writes `<file>.new` beside yours; merge, then
  `bunx @panomc/theme-core accept <id>`.
- Restyled views (step 1) are not affected, unless the plugin renames a class.

## Verify

```sh
bunx @panomc/theme-core check --strict
```

Worked example of all three steps on one plugin: `pano-showcase/theme-evori/` restyles 68 market views in
`src/styles/_evori-store.scss`, ejects two (`src/views/market/StorePage.svelte`, `ProductCard.svelte`) and places two
widgets in `src/pages/Landing.svelte`.

Human docs: `theme-core/docs/THEME-AUTHOR-GUIDE.md` ("Plugin UI in your theme"),
`https://panomc.com/docs/theme/views/` ("Redrawing a plugin's view", "Blocks, claims and slots").
