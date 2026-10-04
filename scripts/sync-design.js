// Copies panel-ui/design/ (the source of truth for the panel design guidelines) into every other
// repo that renders panel UI, and makes sure their CLAUDE.md / AGENTS.md point at it.
//
//   bun scripts/sync-design.js            # siblings resolved from the umbrella workspace (..)
//   PANO_ROOT=/path/to/Pano bun scripts/sync-design.js
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const panelUi = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(process.env.PANO_ROOT || join(panelUi, '..'));
const source = join(panelUi, 'design');

const START = '<!-- pano-design-guidelines:start -->';
const END = '<!-- pano-design-guidelines:end -->';
const BLOCK = `${START}
## Panel design guidelines

Before designing or changing any panel UI (pages, components, modals, alerts, forms…), read
\`design/README.md\` and then **only** the topic file it points to for what you are building. These
rules are mandatory. Do not load every file in \`design/\`.
${END}`;

const pluginsDir = join(root, 'pano-web-platform', 'plugins');
const plugins = existsSync(pluginsDir)
  ? readdirSync(pluginsDir)
      .filter((name) => name.startsWith('pano-plugin-'))
      .map((name) => join(pluginsDir, name))
  : [];

const targets = [join(root, 'setup-ui'), join(root, 'pano-boilerplate-plugin'), ...plugins].filter(
  (dir) => existsSync(join(dir, '.git')),
);

/**
 * @param {string} file
 */
function ensurePointer(file) {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const start = current.indexOf(START);
  const end = current.indexOf(END);

  const next =
    start !== -1 && end !== -1
      ? current.slice(0, start) + BLOCK + current.slice(end + END.length)
      : (current.trimEnd() ? current.trimEnd() + '\n\n' : '') + BLOCK + '\n';

  if (next !== current) writeFileSync(file, next);
}

ensurePointer(join(panelUi, 'CLAUDE.md'));
ensurePointer(join(panelUi, 'AGENTS.md'));

for (const dir of targets) {
  const dest = join(dir, 'design');
  rmSync(dest, { recursive: true, force: true });
  cpSync(source, dest, { recursive: true });
  ensurePointer(join(dir, 'CLAUDE.md'));
  ensurePointer(join(dir, 'AGENTS.md'));
  console.log(`synced ${dir}`);
}
