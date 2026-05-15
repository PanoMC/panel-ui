import { build } from 'bun';
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  renameSync,
  copyFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const libRootDir = './static/lib';
const tempEntryDir = './.lib-bundle-temp';
const tempBundleDir = './.lib-bundle-output';
const internalLibsModulePath = './src/lib/internalLibs.js';

const svelteEntries = {
  'index': 'svelte',
  'animate': 'svelte/animate',
  'easing': 'svelte/easing',
  'motion': 'svelte/motion',
  'store': 'svelte/store',
  'transition': 'svelte/transition',
  'internal': 'svelte/internal',
  'internal-client': 'svelte/internal/client',
  'internal-disclose-version': 'svelte/internal/disclose-version',
  'internal-flags-legacy': 'svelte/internal/flags/legacy',
  'internal-flags-async': 'svelte/internal/flags/async',
  'internal-flags-tracing': 'svelte/internal/flags/tracing',
  'internal-server': 'svelte/internal/server',
  'legacy': 'svelte/legacy',
  'events': 'svelte/events',
  'i18n': 'svelte-i18n',
};

const sdkEntries = {
  'index': '@panomc/sdk',
  'components-theme': '@panomc/sdk/components/theme',
  'components-panel': '@panomc/sdk/components/panel',
  'toasts': '@panomc/sdk/toasts',
  'utils-api': '@panomc/sdk/utils/api',
  'utils-auth': '@panomc/sdk/utils/auth',
  'utils-tooltip': '@panomc/sdk/utils/tooltip',
  'utils-language': '@panomc/sdk/utils/language',
  'utils-component': '@panomc/sdk/utils/component',
  'utils-text': '@panomc/sdk/utils/text',
  'variables': '@panomc/sdk/variables',
  'svelte': '@panomc/sdk/svelte',
  'internal': '@panomc/sdk/internal',
};

async function bundle(entries, outDir, label) {
  console.log(`Generating entry points for ${label}...`);
  const entryFiles = [];
  const currentTempDir = join(tempEntryDir, label.toLowerCase());
  mkdirSync(currentTempDir, { recursive: true });

  for (const [name, path] of Object.entries(entries)) {
    const entryPath = join(currentTempDir, `${name}.js`);
    let content = `export * from "${path}";\n`;
    // These modules have default exports that need to be preserved
    if (path === '@panomc/sdk/utils/api' || path === '@panomc/sdk/utils/tooltip') {
      content += `export { default } from "${path}";\n`;
    }
    writeFileSync(entryPath, content);
    entryFiles.push(entryPath);
  }

  console.log(`Bundling ${label}...`);
  const result = await build({
    entrypoints: entryFiles,
    outdir: outDir,
    format: 'esm',
    target: 'browser',
    minify: true,
    splitting: true,
    naming: '[name].[ext]',
  });

  if (!result.success) {
    console.error(`${label} build failed:`);
    console.error(result.logs);
    process.exit(1);
  }
}

// SHA256 over (relative_path \0 file_bytes \0) for every file, walked in sorted order so
// the digest is deterministic across runs with identical inputs.
function hashDirectory(dir) {
  const hasher = createHash('sha256');
  function walk(d, prefix) {
    const entries = readdirSync(d).sort();
    for (const name of entries) {
      const full = join(d, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full, rel);
      } else {
        hasher.update(rel + '\0');
        hasher.update(readFileSync(full));
        hasher.update('\0');
      }
    }
  }
  walk(dir, '');
  return hasher.digest('hex').slice(0, 16);
}

// Wipe previous outputs entirely. We intentionally do NOT retain older hash dirs: the URL
// is the content identifier and stale clients are expected to hit 404 -> reload, not be
// served back old code that no longer matches what we built.
if (existsSync(libRootDir)) rmSync(libRootDir, { recursive: true, force: true });
if (existsSync(tempBundleDir)) rmSync(tempBundleDir, { recursive: true, force: true });
if (existsSync(tempEntryDir)) rmSync(tempEntryDir, { recursive: true, force: true });

mkdirSync(join(tempBundleDir, 'svelte'), { recursive: true });
mkdirSync(join(tempBundleDir, 'sdk'), { recursive: true });
mkdirSync(join(tempBundleDir, 'bootstrap'), { recursive: true });
mkdirSync(tempEntryDir, { recursive: true });

await bundle(svelteEntries, join(tempBundleDir, 'svelte'), 'Svelte');
await bundle(sdkEntries, join(tempBundleDir, 'sdk'), 'SDK');

// Copy Bootstrap bundle (pre-built, no need to re-bundle)
const bootstrapSrc = './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';
if (existsSync(bootstrapSrc)) {
  copyFileSync(bootstrapSrc, join(tempBundleDir, 'bootstrap', 'bootstrap.bundle.min.js'));
  console.log('Copied Bootstrap bundle into temp output');
} else {
  console.warn('Bootstrap bundle not found at:', bootstrapSrc);
}

const internalLibsHash = hashDirectory(tempBundleDir);
console.log('Internal libs hash:', internalLibsHash);

mkdirSync(libRootDir, { recursive: true });
renameSync(tempBundleDir, join(libRootDir, internalLibsHash));

mkdirSync('./src/lib', { recursive: true });
writeFileSync(
  internalLibsModulePath,
  `// AUTO-GENERATED by scripts/bundle-internal-libs.js — do not edit.\n` +
  `// The hash changes on every bundle, so this file is gitignored.\n` +
  `export const internalLibsHash = ${JSON.stringify(internalLibsHash)};\n`,
);

rmSync(tempEntryDir, { recursive: true, force: true });

console.log(`All libraries bundled successfully into ${libRootDir}/${internalLibsHash}`);
