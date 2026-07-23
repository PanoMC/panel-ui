import { createViteConfig } from '@panomc/theme-core/kit/vite-config';
import fs from 'fs';
import path from 'path';
import { collectLicenses } from './scripts/generate-licenses.js';

// Global flag to ensure licenses are generated only once per build
let licensesGenerated = false;

// Panel-only OSS license collection: emits build/licenses.json from the panel's
// installed dependency tree. Ported verbatim from the pre-migration vite.config.js;
// the collectLicenses helper still lives in scripts/generate-licenses.js.
function generateLicensesPlugin() {
  let outDir = '';

  return {
    name: 'generate-licenses',
    apply: 'build',
    configResolved() {
      outDir = path.resolve(process.cwd(), 'build');
    },
    async closeBundle() {
      // Don't regenerate if file already exists (SSR and client build run in separate processes)
      const licensesPath = path.join(outDir, 'licenses.json');
      if (fs.existsSync(licensesPath)) {
        return;
      }

      // Run only once (closeBundle is called for both SSR and client builds)
      if (!licensesGenerated) {
        licensesGenerated = true;
        try {
          console.log('Generating licenses...');
          // Ensure the build directory exists
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }
          collectLicenses(outDir);
          console.log('Licenses generated successfully.');
        } catch (err) {
          console.error('Failed to generate licenses:', err);
          // Don't fail the build, just warn
        }
      }
    },
  };
}

export default createViteConfig({
  // Panel is mounted under /panel — drives the extra dev proxy entry and hmr path.
  base: '/panel',
  // Panel copies only lang/ into build/ (no screenshots).
  copyFolders: ['lang'],
  // Dev-only ssr.noExternal entries beyond the core defaults (@panomc/sdk,
  // @panomc/theme-core, svelte-i18n) that the panel's editor/chart stack needs.
  extraNoExternalDev: [
    'chart.js',
    '@tiptap/**',
    'prosemirror-**',
    '@tiptap/pm',
    '@jill64/universal-sanitizer',
  ],
  // Panel-only OSS license collection plugin.
  extraPlugins: [generateLicensesPlugin()],
  // The panel's vendored @panomc/sdk (a git submodule, older snapshot) does not
  // declare a "./core/*" subpath in its package `exports`, so core kit's imports
  // of @panomc/sdk/core/js/{variables,api.util,...} fail strict exports
  // resolution at build time. Redirect that prefix to the submodule's on-disk
  // core/ dir. This ALSO unifies the module instance with the panel's own
  // $lib/{variables,api.util}.js (which import ../pano-sdk/core/js/* relatively),
  // so the factory's runtime env updates (updateApiUrl, updatePanoWebsiteUrl) and
  // the panel's app code share one API_URL binding — preserving pre-migration
  // runtime behavior. (vanilla-theme instead ships an SDK that exports ./core/*.)
  extraAliases: {
    // sdk now comes from the theme-core submodule via node_modules (its
    // package exports ./core/*); no vendored-path alias needed anymore.
  },
});
