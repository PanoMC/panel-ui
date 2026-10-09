# Home page and routes of a theme

Both are keys of `theme.config.js`. Route files under `src/routes/` are generated; never edit or add files there.

## Decide

| Decision                   | Default                                                                                                     | Read it from                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Home page                  | no `home` key: the admin picks between the posts feed, plugin pages that offer themselves and a custom path | the request describes a landing: add an option with `page`, make it `default` |
| A new page                 | `routes.add` with a file under `src/pages/`                                                                 | the page shows plugin data: it belongs to the plugin as a view with `path`    |
| A different address        | `routes.rename`                                                                                             | the request asks for other words in the URL (`/shop` for `/store`)            |
| A page that must not exist | `routes.disable`                                                                                            | never delete or edit a generated route file for this                          |

## Rules

1. Home:

```js
home: {
  default: "landing",
  options: {
    posts:   { label: "Posts" },
    landing: { label: { "en-US": "Landing", tr: "Açılış" }, page: "./src/pages/Landing.svelte" },
    store:   { label: "Store", path: "/store" },       // a plugin page by its canonical path
    custom:  { label: "Custom page", path: "*" },      // the admin types a site path
  },
},
```

The admin chooses from these options in the panel; no choice means `default`. A choice that cannot be shown (plugin
removed) falls back to `default`, then to the posts feed. The posts feed is always served at `/posts`. 2. Routes:

```js
routes: {
  add:     { "/staff-team": "./src/pages/StaffTeam.svelte" },
  disable: ["/rules"],
  rename:  { "/store": "/shop", "/store/[slug]": "/shop/[slug]" },
},
```

- Canonical paths (route files, plugin pages) never change; the map changes only what visitors see.
- Both sides of a rename carry the same `[param]` names. A renamed-away path answers 308, a disabled path 404.
- `add` on a path that exists is an error. Nothing may target `/__pano*`.

3. Write every link in your markup as `href={route("/store")}` (`route` from `$pano/registry/index.js`; in a plugin from
   `@panomc/sdk/utils/route`) with the canonical path, never the renamed one. Mails and redirects from Pano follow the map.
4. Rename every path of a family together (`/store` and `/store/[slug]`).
5. A plugin page offers itself as a home option with `home: { label }` in its `view` (`plugin-views.md`).

## Verify

```sh
bunx @panomc/theme-core check --strict     # C9 routes, C10 home
```

## Worked examples

| What                                                                       | File                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Landing as default home, store and posts as options, posts renamed to news | `pano-showcase/theme-evori/theme.config.js`, `pano-showcase/theme-evori/src/pages/Landing.svelte` |
| Routes kept in a file of their own                                         | `pano-showcase/theme/theme.config.routes.js`                                                      |

Human docs: `theme-core/docs/THEME-AUTHOR-GUIDE.md` ("Routes", "Home page"), `https://panomc.com/docs/handbook/theme/pages/`.
