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

// Same class of problem for Chart.js: chartjs-adapter-date-fns registers the
// date adapter on the chart.js copy IT imports. When the dev dep-optimizer
// discovers the adapter lazily (first visit to /statistics), it bundles a
// private chart.js into that entry, the page's charts use the other copy, and
// time scales die with "This method is not implemented: Check that a complete
// date adapter is provided." Pre-bundle the trio together and dedupe chart.js.
const CHART_OPTIMIZE_INCLUDE = ['chart.js', 'chartjs-adapter-date-fns', 'date-fns'];
const CHART_DEDUPE = ['chart.js', 'date-fns'];

// The file manager's CodeMirror 6 editor (SM-31) has the same one-instance rule: every
// extension is checked against the @codemirror/state and @codemirror/view copies the editor
// was created with, so a second copy bundled into a lazily discovered lang- entry dies with
// "Unrecognized extension value in extension set". The editor is loaded through a dynamic
// import (it must stay out of the panel's main chunk), which is exactly the case the dev
// dep-optimizer discovers late — so pre-bundle the set and dedupe the two cores.
const CODEMIRROR_OPTIMIZE_INCLUDE = [
  'codemirror',
  '@codemirror/state',
  '@codemirror/view',
  '@codemirror/language',
  '@codemirror/lang-json',
  '@codemirror/lang-yaml',
  '@codemirror/legacy-modes/mode/properties',
  '@codemirror/legacy-modes/mode/toml',
  '@codemirror/theme-one-dark',
  // The Lezer layer underneath: the highlighter looks a syntax node's `Tag`s up by identity,
  // so a language whose tags came from a second @lezer/highlight copy crashes it with
  // "can't access property Symbol.iterator, tags is undefined" the moment a file is opened.
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr',
];
const CODEMIRROR_DEDUPE = [
  '@codemirror/state',
  '@codemirror/view',
  '@codemirror/language',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr',
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
    config.optimizeDeps.include.push(
      ...EDITOR_OPTIMIZE_INCLUDE,
      ...CHART_OPTIMIZE_INCLUDE,
      ...CODEMIRROR_OPTIMIZE_INCLUDE,
    );
    config.resolve.dedupe.push(...EDITOR_DEDUPE, ...CHART_DEDUPE, ...CODEMIRROR_DEDUPE);

    return config;
  },
});
