/**
 * Generates the runtime shim modules that let plugin bundles share the HOST
 * application's own bundled Svelte / SDK module instances.
 *
 * Architecture ("registry + shims"):
 *   - src/hooks.client.js captures the host bundle's live module instances into
 *     globalThis.__PANO_RUNTIME__ (a registry of lazy import thunks) before hydration.
 *   - The import map in hooks.server.js points every bare specifier plugins use
 *     ("svelte", "svelte/store", "@panomc/sdk", ...) at the tiny shim files this
 *     script emits into static/runtime/.
 *   - Each shim awaits the registry and re-exports the host's module instance, so
 *     host pages and plugins run on ONE Svelte runtime (same effect scheduler, same
 *     component context) and plugins download no second runtime copy at hydration.
 *
 * The shim URLs are STABLE across deploys (unlike the old /lib/<hash>/ scheme), so
 * stale cached HTML can never 404 on them; their content only changes when the
 * theme's svelte/sdk dependency is upgraded, which the ?v=<runtimeShimsHash> query
 * appended by hooks.server.js cache-busts.
 *
 * Export lists are derived from the actual installed packages at build time
 * (Bun.build flattens each specifier, Bun.Transpiler enumerates its exports), so a
 * svelte upgrade automatically regenerates the full export surface.
 */
import { mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const outputRootDir = './static/runtime';
const tempEntryDir = './.runtime-shims-temp';
const generatedModulePath = './src/lib/runtimeShims.js';

// Specifier → output file. Keys MUST stay in sync with the import map in
// src/hooks.server.js and the registry thunks in src/hooks.client.js.
const svelteShims = {
  'svelte': 'svelte/index.js',
  'svelte/animate': 'svelte/animate.js',
  'svelte/easing': 'svelte/easing.js',
  'svelte/motion': 'svelte/motion.js',
  'svelte/store': 'svelte/store.js',
  'svelte/transition': 'svelte/transition.js',
  'svelte/internal': 'svelte/internal.js',
  'svelte/internal/client': 'svelte/internal-client.js',
  'svelte/internal/disclose-version': 'svelte/internal-disclose-version.js',
  'svelte/internal/flags/legacy': 'svelte/internal-flags-legacy.js',
  'svelte/internal/flags/async': 'svelte/internal-flags-async.js',
  'svelte/internal/flags/tracing': 'svelte/internal-flags-tracing.js',
  'svelte/legacy': 'svelte/legacy.js',
  'svelte/events': 'svelte/events.js',
  'svelte/attachments': 'svelte/attachments.js',
  'svelte/reactivity': 'svelte/reactivity.js',
  'svelte/reactivity/window': 'svelte/reactivity-window.js',
  'svelte-i18n': 'svelte/i18n.js',
};

const sdkShims = {
  '@panomc/sdk': 'sdk/index.js',
  '@panomc/sdk/components/theme': 'sdk/components-theme.js',
  '@panomc/sdk/components/panel': 'sdk/components-panel.js',
  '@panomc/sdk/toasts': 'sdk/toasts.js',
  '@panomc/sdk/utils/api': 'sdk/utils-api.js',
  '@panomc/sdk/utils/auth': 'sdk/utils-auth.js',
  '@panomc/sdk/utils/tooltip': 'sdk/utils-tooltip.js',
  '@panomc/sdk/utils/language': 'sdk/utils-language.js',
  '@panomc/sdk/utils/component': 'sdk/utils-component.js',
  '@panomc/sdk/utils/text': 'sdk/utils-text.js',
  '@panomc/sdk/variables': 'sdk/variables.js',
  '@panomc/sdk/svelte': 'sdk/svelte.js',
  '@panomc/sdk/internal': 'sdk/internal.js',
};

// Modules with a default export that `export * from` does not carry over.
const defaultExportSpecs = new Set(['@panomc/sdk/utils/api', '@panomc/sdk/utils/tooltip']);

const identifierRe = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// Names that parse as IdentifierName but cannot be declared with `const` — they must
// go through the aliased-export path (svelte/internal/client exports `if`, `await`, …).
// prettier-ignore
const reservedWords = new Set([
  "await", "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "enum", "export", "extends", "false",
  "finally", "for", "function", "if", "implements", "import", "in", "instanceof",
  "interface", "let", "new", "null", "package", "private", "protected", "public",
  "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof",
  "var", "void", "while", "with", "yield", "arguments", "eval",
]);

async function enumerateExports(spec) {
  const entryPath = join(tempEntryDir, spec.replace(/[^a-z0-9]+/gi, '_') + '.js');
  let entrySource = `export * from ${JSON.stringify(spec)};\n`;
  if (defaultExportSpecs.has(spec)) {
    entrySource += `export { default } from ${JSON.stringify(spec)};\n`;
  }
  writeFileSync(entryPath, entrySource);

  const result = await Bun.build({
    entrypoints: [entryPath],
    target: 'browser',
    format: 'esm',
    splitting: false,
    minify: false,
    // The bundle is only scanned for its export list, never executed or shipped.
    outdir: undefined,
  });

  if (!result.success) {
    console.error(`Failed to bundle '${spec}' for export enumeration:`);
    console.error(result.logs);
    process.exit(1);
  }

  const code = await result.outputs[0].text();
  const transpiler = new Bun.Transpiler({ loader: 'js' });
  const { exports } = transpiler.scan(code);
  return exports.sort();
}

function renderShim(spec, exportNames) {
  const lines = [
    `// AUTO-GENERATED by scripts/generate-runtime-shims.js — do not edit.`,
    `// Re-exports the host application's live ${JSON.stringify(spec)} module instance`,
    `// from the runtime registry populated by src/hooks.client.js.`,
    `const g = globalThis;`,
    `g.__PANO_RT_READY__ ??= new Promise((resolve) => (g.__PANO_RT_RESOLVE__ = resolve));`,
    `const registry =`,
    `  g.__PANO_RUNTIME__ ??`,
    `  (await Promise.race([`,
    `    g.__PANO_RT_READY__,`,
    `    new Promise((_, reject) =>`,
    `      setTimeout(`,
    `        () => reject(new Error("[pano-runtime] host runtime registry missing for " + ${JSON.stringify(spec)})),`,
    `        15000,`,
    `      ),`,
    `    ),`,
    `  ]));`,
    `const m = await registry.import(${JSON.stringify(spec)});`,
  ];

  let i = 0;
  for (const name of exportNames) {
    if (name === 'default') {
      lines.push(`export default m.default;`);
    } else if (identifierRe.test(name) && !reservedWords.has(name)) {
      lines.push(`export const ${name} = m.${name};`);
    } else {
      // Reserved words (exported alias is legal, `const` declaration is not) and
      // arbitrary module namespace names (ES2022 string export names).
      const local = `__pano_export_${i++}`;
      lines.push(`const ${local} = m[${JSON.stringify(name)}];`);
      lines.push(`export { ${local} as ${JSON.stringify(name)} };`);
    }
  }

  return lines.join('\n') + '\n';
}

function hashDirectory(dir) {
  const hasher = createHash('sha256');
  function walk(d, prefix) {
    const entries = readdirSync(d).sort();
    for (const name of entries) {
      const full = join(d, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      if (statSync(full).isDirectory()) {
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

rmSync(outputRootDir, { recursive: true, force: true });
rmSync(tempEntryDir, { recursive: true, force: true });
mkdirSync(join(outputRootDir, 'svelte'), { recursive: true });
mkdirSync(join(outputRootDir, 'sdk'), { recursive: true });
mkdirSync(tempEntryDir, { recursive: true });

const allShims = { ...svelteShims, ...sdkShims };

for (const [spec, outFile] of Object.entries(allShims)) {
  const exportNames = await enumerateExports(spec);
  writeFileSync(join(outputRootDir, outFile), renderShim(spec, exportNames));
  console.log(`Shim ${outFile}: ${exportNames.length} exports`);
}

const runtimeShimsHash = hashDirectory(outputRootDir);

writeFileSync(
  generatedModulePath,
  `// AUTO-GENERATED by scripts/generate-runtime-shims.js — do not edit.\n` +
    `// Changes only when the installed svelte/sdk export surface changes; used by\n` +
    `// hooks.server.js to cache-bust shim URLs in the import map.\n` +
    `export const runtimeShimsHash = ${JSON.stringify(runtimeShimsHash)};\n`,
);

rmSync(tempEntryDir, { recursive: true, force: true });

console.log(`Runtime shims generated into ${outputRootDir} (hash ${runtimeShimsHash})`);
