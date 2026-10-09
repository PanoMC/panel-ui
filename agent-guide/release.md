# Releasing

Releases are made by CI from the commit messages. An agent prepares a release by committing correctly; it never tags,
bumps or uploads.

## Rules

1. Commit messages are conventional commits, one line: `feat: ...` (minor), `fix: ...` (patch), `chore: ...` /
   `docs: ...` (no release). semantic-release reads them to pick the version and write the changelog.
2. Never bump a version by hand: not in `package.json`, `manifest.json` (`"version": "v{version}"` is a placeholder) or
   `gradle.properties`. CI passes the version to the build.
3. Never push unless the person asked for it. A push to a release branch IS a release: plugins and the boilerplate
   release from `dev` (prerelease) and `main`; themes from `dev` and `master`. Read `.releaserc.json` of the repo.
4. **API level.** Every artifact states the Pano API level it needs; Pano refuses to load one without it, and
   `semantic-release-pano` refuses to publish one (`artifact has no api-level`).
   - Plugin: the jar manifest attribute `api-level`, written by `build.gradle.kts` from the Pano it compiles against.
     `apiLevel=` in `gradle.properties` overrides it (the scaffold sets `apiLevel=1` while the pinned Pano dependency
     carries none; delete the line once it does).
   - Theme: `apiLevel` in `build/manifest.json`, stamped at build from the engine (`pano.apiLevel` in
     `theme-core/packages/theme-core/package.json`). Do not write it into the theme's own `manifest.json` unless you
     must pin a different level.
   - Custom app: `apiLevel` written by hand in `manifest.json`.
5. Plugin manifest values are the `plugin*` keys of `gradle.properties` (`pluginId`, `pluginName`, `pluginClass`, ...).
   The id never changes after the first release.
6. Commit what the build generates and the repo tracks: `pano-plugin.lock.json` (plugin), `plugin-contracts/` and
   `core-meta.json` (theme). Never commit `build/`, `node_modules/` or `src/main/resources/plugin-ui/`.
7. Raising a view `contract` or a controller `version` in a plugin makes theme overrides of it fall back to the
   default view until the theme updates. Name the view or controller in the commit message.
8. After a theme or panel release the platform does not pick it up by itself: the pin is `ui-releases.yml` in
   `pano-web-platform` (maintainers only).

## What CI does

| Repo kind  | On push to a release branch                                                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin     | dry run for the next version; `./gradlew build -Pversion=<next>` (Kotlin + UI, lock check, build rules); semantic-release publishes the jar to GitHub and, through `semantic-release-pano`, to the Pano resource store (`dev` to the dev store, `main` to production) |
| Theme      | the shared workflow `theme-release.yml` of the engine repo: install, build, deterministic zip (its sha256 is the license identity), semantic-release                                                                                                                  |
| theme-core | `bun test packages`, then semantic-release                                                                                                                                                                                                                            |

## Before you hand over

```sh
# plugin
bunx pano-plugin check --strict && ./gradlew build
# theme
bunx @panomc/theme-core check --strict && bun run build && bunx @panomc/theme-core package
```

Worked examples: `pano-web-platform/plugins/pano-plugin-faq/.releaserc.json` and `.github/workflows/release.yml`;
`themes/vanilla-theme/.github/workflows/release.yml`; `pano-starter-sveltekit/manifest.json`.

Human docs: `https://panomc.com/docs/handbook/addon/ship/`, `https://panomc.com/docs/handbook/theme/ship/`,
`https://panomc.com/docs/addon/publishing/`, `https://panomc.com/docs/theme/publishing/`.
