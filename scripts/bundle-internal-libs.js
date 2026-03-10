import { build } from 'bun';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const svelteOutDir = './static/lib/svelte';
const sdkOutDir = './static/lib/sdk';
const tempEntryDir = './.lib-bundle-temp';

// Clean and setup
if (existsSync(svelteOutDir)) rmSync(svelteOutDir, { recursive: true, force: true });
if (existsSync(sdkOutDir)) rmSync(sdkOutDir, { recursive: true, force: true });
if (existsSync(tempEntryDir)) rmSync(tempEntryDir, { recursive: true, force: true });

mkdirSync(svelteOutDir, { recursive: true });
mkdirSync(sdkOutDir, { recursive: true });
mkdirSync(tempEntryDir, { recursive: true });

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

await bundle(svelteEntries, svelteOutDir, 'Svelte');
await bundle(sdkEntries, sdkOutDir, 'SDK');

// Copy Bootstrap bundle (pre-built, no need to re-bundle)
const bootstrapOutDir = './static/lib/bootstrap';
if (existsSync(bootstrapOutDir)) rmSync(bootstrapOutDir, { recursive: true, force: true });
mkdirSync(bootstrapOutDir, { recursive: true });

const bootstrapSrc = './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js';
const bootstrapDest = join(bootstrapOutDir, 'bootstrap.bundle.min.js');

if (existsSync(bootstrapSrc)) {
  const { copyFileSync } = await import('node:fs');
  copyFileSync(bootstrapSrc, bootstrapDest);
  console.log('Copied Bootstrap bundle to static/lib/bootstrap/');
} else {
  console.warn('Bootstrap bundle not found at:', bootstrapSrc);
}

// Cleanup
rmSync(tempEntryDir, { recursive: true, force: true });

console.log('All libraries bundled successfully!');
