<!-- pano-design-guidelines:start -->
## Panel design guidelines

Before designing or changing any panel UI (pages, components, modals, alerts, forms…), read
`design/README.md` and then **only** the topic file it points to for what you are building. These
rules are mandatory. Do not load every file in `design/`.
<!-- pano-design-guidelines:end -->

<!-- pano-agent-guide:start -->
## Agent guide

You are in a **Pano panel UI** repo. The panel is not themed and its pages are not named views; the guide matters here when you touch what plugins and the API share with the panel.

Read `agent-guide/README.md` first, then **only** the topic file it points to for your task. Decide from the
request and the code; ask only where the guide says a wrong guess is costly. `agent-guide/` is a synced copy: edit it
in `theme-core/agent-guide/` (repo `PanoMC/sdk`) and run `bun scripts/sync-agent-guide.js` there.

The three rules you will break first:

1. Core panel endpoints are `/api/v1/panel/...`; a plugin panel endpoint is `/api/plugins/<pluginId>/panel/...`, not below the panel base (`plugin-api.md`).
2. Lists are read from `items` and pages from `page`; errors from `error.code` (`plugin-api.md`).
3. Plugin panel pages are registered in code (`pano.ui.page.register`) and follow `design/README.md` (`plugin-panel-ui.md`).
<!-- pano-agent-guide:end -->
