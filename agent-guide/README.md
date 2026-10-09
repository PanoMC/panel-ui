# Pano agent guide

Rules for an AI coding agent that works on a Pano plugin, a Pano theme or a headless front-end. Read this file, then
**only** the topic file for your task. Do not load every file.

The source of truth is `theme-core/agent-guide/` (repo `PanoMC/sdk`). Every other repo carries a synced copy: do not edit
a copy, change it in `theme-core` and run `bun scripts/sync-agent-guide.js` there.

Paths in this guide are written from the folder that holds the Pano repos side by side (`theme-core/`, `themes/`,
`pano-web-platform/plugins/`, `pano-boilerplate-plugin/`, `pano-showcase/`, `pano-starter-sveltekit/`). A worked example
you do not have locally is in the GitHub repo of the same name under `PanoMC`.

## What are you doing?

| Task                                                                 | Read                     |
| -------------------------------------------------------------------- | ------------------------ |
| Making a new plugin                                                  | `plugin-new.md`          |
| Adding a page or a view to a plugin's site UI                        | `plugin-views.md`        |
| Moving plugin logic out of a view (cart, session, formatter)         | `plugin-controllers.md`  |
| Adding an API endpoint to a plugin (site or panel)                   | `plugin-api.md`          |
| Plugin panel UI (admin pages, settings)                              | `plugin-panel-ui.md`     |
| Making a new theme                                                   | `theme-new.md`           |
| Changing how a plugin's view looks in a theme (start here if unsure) | `theme-plugin-ui.md`     |
| Behave or look different when a plugin is installed                  | `theme-plugin-ui.md`     |
| Restyling without touching markup                                    | `theme-restyle.md`       |
| Overriding an engine or plugin view in a theme                       | `theme-override-view.md` |
| Adding a block or widget to a page                                   | `theme-blocks.md`        |
| Home page and routes of a theme                                      | `theme-routes-home.md`   |
| A headless front-end (starter, custom app, external origin)          | `headless.md`            |
| Releasing: API level, manifest, what CI does                         | `release.md`             |
| Testing and checking: which command where                            | `testing.md`             |
| Upgrading an old plugin or theme to the new model                    | `upgrade.md`             |
| What never to do                                                     | `do-not.md`              |

## Decide first, ask rarely

Read the request, the repo and the existing code, and decide by yourself wherever a sensible default exists. The topic
files give a **Decide** block: the ladder from the cheapest step down, the default for each step and where the answer
can be read. Ask the person only when the answer is in neither the request nor the code **and** a wrong guess would cost
real rework or change what they get (restyle or redraw a plugin view; public or private plugin; Bootstrap kept or bare
for a new theme; custom app run by Pano or external origin). Ask one question at a time and name the default you would
otherwise take.

## Rules that hold everywhere

1. JavaScript with JSDoc only. No TypeScript files, no `.d.ts`.
2. Every plugin view has a name `<ns>:<ViewName>` and a contract version. A theme redraws views, never plugin logic.
3. A plugin declares relative API paths only. Pano serves them at `/api/plugins/<pluginId>/...` (site) and
   `/api/plugins/<pluginId>/panel/...` (panel). Core is `/api/v1/...`.
4. A list answers `{ items }`; a paged list adds `{ page }`. Every error answers `{ error: { code, ... } }`.
5. Commits are one conventional line (`feat: ...`, `fix: ...`). Never bump a version by hand: CI does it.
6. Front-end repos use Bun; JVM repos use `./gradlew`.

## Longer documents for people

Send a person to these; do not repeat them. In the repo: `theme-core/docs/` (`QUICKSTART-PLUGIN.md`,
`QUICKSTART-THEME.md`, `PLUGIN-VIEWS.md`, `CONTROLLERS.md`, `THEME-AUTHOR-GUIDE.md`, `MIGRATION.md`). On the website
(source: repo `PanoMC/docs`):

| Subject                                                    | Published path                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme handbook: setup, design, pages, translate, ship      | `https://panomc.com/docs/handbook/theme/` (`setup/`, `design/`, `pages/`, `translate/`, `ship/`)                                                                                                                                                                                                           |
| Plugin handbook: setup, backend, frontend, translate, ship | `https://panomc.com/docs/handbook/addon/` (`setup/`, `backend/`, `frontend/`, `translate/`, `ship/`)                                                                                                                                                                                                       |
| Theme reference                                            | `https://panomc.com/docs/theme/getting-started/`, `structure/`, `customization/`, `views/`, `settings/`, `localization/`, `packaging/`, `publishing/`                                                                                                                                                      |
| Plugin reference                                           | `https://panomc.com/docs/addon/getting-started/`, `architecture/`, `backend/`, `endpoints/`, `database/`, `events/`, `permissions/`, `configuration/`, `localization/`, `manifest/`, `panel-ui/`, `theme-ui/`, `frontend/`, `premium/`, `freemium/`, `publishing/`, `api-reference/`, `backend-reference/` |
| API and headless                                           | `https://panomc.com/docs/integration/getting-started/`, `api-basics/`, `access/`, `client/`, `openapi/`, `headless/`, `widgets/`, `webhooks/`, `testing/`, `api-reference/`                                                                                                                                |
