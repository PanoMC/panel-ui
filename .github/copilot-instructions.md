# Copilot instructions

The rules for this repository are in `AGENTS.md` at its root. Read it first, then only the guide file it points to for
your task (`agent-guide/README.md`, and `design/README.md` in the panel repos). Follow them over your own defaults.

The ones broken most often:

- Commit messages are one line in conventional form (`fix:`, `feat:`, `chore:`, `docs:` …), written for the person who
  updates Pano: they become the changelog. Never "Refactor code structure for improved readability" or another
  generic message.
- Never commit generated or temporary output: `.runtime-shims-temp/`, `.lib-bundle-output/`, `static/runtime/`,
  `static/lib/`, `build/`, `node_modules/`. If one shows up in the changes, leave it out.
- Keep every `pano-*` class, `<PluginSlot>`, `<Hook>` and prop of a view; add classes next to them, never replace them.
- Run the repository's checks before you push (`bun run lint`, and in `theme-core` `bun scripts/test-each.js`), and do
  not push on top of a red CI run: fix it first.
