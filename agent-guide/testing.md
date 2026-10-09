# Testing and checking

Run the checks of the repo kind you are in before you say the work is done. State what you ran and what you could not run.

## Plugin

| Command                                   | Checks                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `bunx pano-plugin check`                  | view names and `view` literals, import rules, lock, style rules, Svelte pin, API paths                                               |
| `bunx pano-plugin check --strict`         | the same with warnings as errors, plus a samples file with `filled` (and every standard state not in `notApplicable`) for every view |
| `bunx pano-plugin check --styles badge`   | the stricter style lint behind the store badge                                                                                       |
| `bunx pano-plugin classes`                | structural elements without a semantic class (`--fix` writes them)                                                                   |
| `bunx pano-plugin samples`                | lists the views and their sample states                                                                                              |
| `bun run build`                           | the UI package; fails on a contract or controller change without a higher version                                                    |
| `./gradlew build` (`-Pnoui` skips the UI) | Kotlin, and the jar with the UI                                                                                                      |

Repo-specific scripts come on top: read `scripts` in `package.json` (market: `bun run test`, `bun run check:theme`,
`bun run check:panel`).

## Theme

| Command                                  | Checks                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| `bunx @panomc/theme-core check`          | Svelte pin, manifest, settings schema, lang overrides, rules C1 to C16   |
| `bunx @panomc/theme-core check --strict` | warnings count as errors; required before packaging                      |
| `bunx @panomc/theme-core check --fix`    | writes missing or outdated controller pins                               |
| `bunx @panomc/theme-core list-views`     | every view, its contract, what the theme overrides                       |
| `bunx @panomc/theme-core sync`           | regenerates routes, stubs, language files; refreshes `plugin-contracts/` |
| `bun run build`                          | the production build                                                     |
| `<your Pano address>/__pano/views`       | every view with its sample data, in the running theme (Development Mode) |

In the official themes the same commands are `bun run check` and `bun run sync`. The rule list is at the top of
`theme-core/packages/theme-core/bin/check.js`.

## Headless front-end

`bun test`, `bun run build`, `bun run check` (`svelte-check` and `pano-client check`). `bun run e2e` needs an isolated
Pano instance and is not part of `bun test`.

## theme-core itself

```sh
bun scripts/test-each.js                     # every *.test.js in its own process (mocks leak between files otherwise)
bun scripts/test-each.js plugin-kit check    # only files whose path contains one of the filters
bun docs/check-links.mjs                     # paths, commands, flags and package exports quoted in docs/ and agent-guide/
bun scripts/sync-agent-guide.js --check      # the synced copies of this guide are current
```

Do not run a bare `bun test` at the root of theme-core: the files share one process and fail on leaked mocks.

## Rules

1. A green check is not a running plugin or theme. When you can, load it in a Pano with Development Mode on and open the
   page; when you cannot, say so.
2. Look at every palette the theme ships and at phone width before you call a visual change done.
3. Do not start, stop or reconfigure a Pano instance, a database or a dev server you did not start. Never kill processes
   by name pattern.
4. Do not edit a test, a lock or a snapshot to make a check pass; fix the cause or report it.

## Known rough edges

- `check --strict` in a theme fails on a freshly ejected plugin view until the plugin text store is renamed
  (`theme-override-view.md`).
- `vite dev` of a theme inside a Bun workspace does not hydrate; test from a build.
- `pano-plugin check` skips the API path check, with a note, when it finds no SDK.

Human docs: `https://panomc.com/docs/integration/testing/`.
