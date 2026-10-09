// Rewrites src/lib/activityLogTypes.json: every activity log type the backend can write.
//
//   bun scripts/refresh-activity-log-types.js [path to pano-web-platform]
//
// The type of a log is its class name without `Log`, in upper snake case (`PanelActivityLog.typeOf`).
// The classes that extend `PanelActivityLog` are read from the platform's own sources and from the
// built-in plugins (`plugins/*`); a plugin outside this checkout adds its types to
// its own texts and is not listed here. After adding a log class: run this script, then add the
// text of the new type to `activity-logs` in lang/en-US.json, tr.json and ru.json
// (`activityLogTypes.test.js` fails until all three have it).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(
  process.argv[2] || new URL('../../pano-web-platform', import.meta.url).pathname,
);
const target = new URL('../src/lib/activityLogTypes.json', import.meta.url);

/**
 * Types written by code that is not in the checkout yet (a work order that adds the class later).
 * An entry drops out of the list as soon as the scan finds its class.
 */
export const PENDING = [
  'CREATED_WEBHOOK',
  'UPDATED_WEBHOOK',
  'DELETED_WEBHOOK',
  'REDELIVERED_WEBHOOK',
];

/** Open base classes, not log types: a plugin's own subclass carries its text in the plugin's lang file. */
const BASES = new Set(['PluginActivityLog']);

const SKIP = new Set(['build', 'node_modules', '.git', '.gradle', 'test']);

function* kotlinFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;

    const path = join(dir, name);
    const stat = statSync(path);

    if (stat.isDirectory()) yield* kotlinFiles(path);
    else if (name.endsWith('.kt')) yield path;
  }
}

/** Same derivation as `TextUtil.convertToSnakeCase` + `uppercase()`. */
export function typeOf(className) {
  return className
    .replace(/Log$/, '')
    .replace(/([a-z])([A-Z])/g, (_, a, b) => `${a}_${b.toLowerCase()}`)
    .toUpperCase();
}

/** The classes of one Kotlin source that extend PanelActivityLog directly. */
export function logClasses(source) {
  const found = [];
  // One chunk per class declaration, so a constructor with default values cannot swallow its neighbour.
  const chunks = source.split(/^(?=(?:open |data |internal )?class\s)/m);

  for (const chunk of chunks) {
    const name = chunk.match(/^(?:open |data |internal )?class\s+([A-Za-z0-9_]+)/)?.[1];

    if (name && !BASES.has(name) && /\)\s*:\s*PanelActivityLog\s*\(/.test(chunk)) found.push(name);
  }

  return found;
}

if (import.meta.main) {
  const types = new Set();

  for (const sub of ['Pano/src/main', 'plugins']) {
    let dir;

    try {
      dir = join(root, sub);
      statSync(dir);
    } catch {
      continue;
    }

    for (const file of kotlinFiles(dir)) {
      if (sub === 'plugins' && !file.includes('/src/main/')) continue;

      for (const name of logClasses(readFileSync(file, 'utf8'))) types.add(typeOf(name));
    }
  }

  const sorted = [...new Set([...types, ...PENDING])].sort();

  writeFileSync(target, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`${sorted.length} activity log types written to src/lib/activityLogTypes.json`);
}
