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

// Every module the editor stack imports, so the dev dep-optimizer bundles
// them in one pass instead of discovering them lazily per @tiptap/* entry.
// (@tiptap/pm has no root export, only subpaths.)
const EDITOR_OPTIMIZE_INCLUDE = [
  '@tiptap/core',
  '@tiptap/pm/state',
  '@tiptap/pm/model',
  '@tiptap/pm/view',
  '@tiptap/pm/transform',
  '@tiptap/starter-kit',
  '@tiptap/extension-image',
  '@tiptap/extension-text-style',
  'prosemirror-state',
  'prosemirror-model',
  'prosemirror-view',
  'prosemirror-transform',
];

// Package names (dedupe works per package) that must resolve to the panel's
// single copy.
const EDITOR_DEDUPE = [
  '@tiptap/core',
  '@tiptap/pm',
  'prosemirror-state',
  'prosemirror-model',
  'prosemirror-view',
  'prosemirror-transform',
];

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
  // The TipTap editor stack must resolve to ONE ProseMirror instance. Left to
  // lazy discovery, the dev dep-optimizer bundles a private prosemirror-state /
  // -model / -transform copy into each @tiptap/* entry it finds, and the editor
  // then dies on mount with "Adding different instances of a keyed plugin
  // (plugin$)". Pre-bundling the whole stack up front (and deduping the
  // prosemirror packages to the panel's root) keeps a single shared copy.
  finalize: (config) => {
    config.optimizeDeps.include.push(...EDITOR_OPTIMIZE_INCLUDE);
    config.resolve.dedupe.push(...EDITOR_DEDUPE);

    return config;
  },
});
