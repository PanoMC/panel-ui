#!/usr/bin/env node
// Builds the synthesized React package that design-sync converts for claude.ai/design.
//
// panel-ui is a Svelte 5 app; claude.ai/design renders React. This script bridges:
//   Stage A  esbuild + esbuild-svelte compile every src/lib/components/**/*.svelte
//            (plus $app/* shims, svelte-i18n init from lang/en-US.json, demo Pano
//            context, window.bootstrap) into one self-contained ESM file.
//   Stage B  generated React wrappers: each component mounts its Svelte counterpart
//            via svelte's mount() with a shared context Map; React children render
//            into Svelte snippets through portals. Emits dist/index.js + index.d.ts.
//   Stage C  sass-compiles src/styles/style.scss, rewrites /panel/assets/ font URLs
//            to fonts/, extracts @font-face into dist/fonts/pano-fonts.css and
//            copies the font binaries.
//
// Output: .design-sync/bridge-pkg/ (gitignored). package-build.mjs consumes it via
// --entry .design-sync/bridge-pkg/dist/index.js. Re-run me whenever components,
// props-map.json, or styles change (cfg.buildCmd points here).
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..'); // repo root
const PKG = join(ROOT, '.design-sync', 'bridge-pkg');
const DIST = join(PKG, 'dist');
const DOCS = join(PKG, 'docs');
const SRC_CACHE = join(ROOT, '.design-sync', '.cache', 'bridge-src');
const PROPS_MAP = JSON.parse(fs.readFileSync(join(HERE, 'props-map.json'), 'utf8'));

const dsRequire = createRequire(join(ROOT, '.ds-sync', 'package.json'));
const { build } = await import(pathToFileURL(dsRequire.resolve('esbuild')).href);
const esbuildSvelte = (await import(pathToFileURL(dsRequire.resolve('esbuild-svelte')).href)).default;

fs.rmSync(PKG, { recursive: true, force: true });
fs.rmSync(SRC_CACHE, { recursive: true, force: true });
for (const d of [DIST, DOCS, join(DIST, 'fonts'), join(SRC_CACHE, 'shims')]) fs.mkdirSync(d, { recursive: true });

// ── component discovery ───────────────────────────────────────────────────
const comps = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.svelte')) comps.push({ name: e.name.slice(0, -7), path: p });
  }
})(join(ROOT, 'src', 'lib', 'components'));
comps.sort((a, b) => a.name.localeCompare(b.name));
const dupes = comps.filter((c, i) => comps.findIndex(x => x.name === c.name) !== i);
if (dupes.length) throw new Error('duplicate component names: ' + dupes.map(d => d.name).join(', '));
console.error(`[bridge] ${comps.length} components`);

// module-context exports (e.g. modal show()/hide()) become statics on the wrapper;
// slot/snippet render targets become React.ReactNode props (Svelte 5 renders
// snippet props into same-named legacy <slot>s, so the portal bridge covers both)
const modExports = {};
const slotProps = {};
for (const c of comps) {
  const txt = fs.readFileSync(c.path, 'utf8');
  const m = txt.match(/<script[^>]*(?:context="module"|module)[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    const names = [...m[1].matchAll(/export\s+(?:async\s+)?(?:function|const|let)\s+(\w+)/g)].map(x => x[1]);
    if (names.length) modExports[c.name] = names;
  }
  const slots = new Set();
  for (const s of txt.matchAll(/<slot\s+name="([\w-]+)"/g)) slots.add(s[1]);
  if (/<slot(\s|\/|>)(?![^>]*name=)/.test(txt)) slots.add('children');
  for (const s of txt.matchAll(/\{@render\s+(\w+)/g)) slots.add(s[1] === 'children' ? 'children' : s[1]);
  if (slots.size) slotProps[c.name] = [...slots].filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));
}

// ── Stage A: shims + entry + compile ──────────────────────────────────────
const w = (p, s) => fs.writeFileSync(p, s);
w(join(SRC_CACHE, 'shims', 'app-environment.js'),
  `export const browser = true;\nexport const dev = false;\nexport const building = false;\nexport const version = 'design-sync';\n`);
w(join(SRC_CACHE, 'shims', 'app-navigation.js'),
  `const noop = () => {};\nconst anoop = async () => {};\nexport const goto = anoop, invalidate = anoop, invalidateAll = anoop, preloadData = anoop, preloadCode = anoop;\nexport const beforeNavigate = noop, afterNavigate = noop, onNavigate = noop, disableScrollHandling = noop, pushState = noop, replaceState = noop;\n`);
w(join(SRC_CACHE, 'shims', 'app-paths.js'),
  `export const base = '';\nexport const assets = '';\nexport const resolveRoute = (id) => id;\nexport const resolve = (id) => id;\nexport const asset = (p) => p;\n`);
w(join(SRC_CACHE, 'shims', 'app-stores.js'), `import { readable } from 'svelte/store';
import { demoUser } from '../pano-context.js';
const pageValue = {
  url: new URL('https://demo.panomc.local/panel/dashboard'),
  params: {}, route: { id: '/(panel)/dashboard' }, status: 200, error: null,
  data: { user: demoUser }, form: null, state: {},
};
export const page = readable(pageValue);
export const navigating = readable(null);
export const updated = Object.assign(readable(false), { check: async () => false });
export const getStores = () => ({ page, navigating, updated });
`);
w(join(SRC_CACHE, 'shims', 'app-state.js'), `import { demoUser } from '../pano-context.js';
export const page = {
  url: new URL('https://demo.panomc.local/panel/dashboard'),
  params: {}, route: { id: '/(panel)/dashboard' }, status: 200, error: null,
  data: { user: demoUser }, form: null, state: {},
};
export const navigating = { to: null, from: null, type: null, complete: null };
export const updated = { current: false, check: async () => false };
`);
w(join(SRC_CACHE, 'shims', 'empty.js'), `export default {};\n`);
// CJS so named imports resolve at runtime instead of failing esbuild's static
// ESM export check — these modules exist in server-only code paths (SDK
// PluginManager zip handling etc.) that never execute in a rendered design.
w(join(SRC_CACHE, 'shims', 'node-shim.cjs'),
  `module.exports = new Proxy(function () {}, {\n  get: (t, k) => (k === '__esModule' ? false : module.exports),\n  apply: () => module.exports,\n  construct: () => ({}),\n});\n`);
w(join(SRC_CACHE, 'shims', 'sveltejs-kit.js'), `export function error(status, body) {
  const e = new Error(typeof body === 'string' ? body : (body && body.message) || String(status));
  e.status = status;
  throw e;
}
export function redirect(status, location) {
  const e = new Error('redirect ' + location);
  e.status = status;
  e.location = location;
  throw e;
}
export const fail = (status, data) => ({ status, data });
export const json = (data) => new Response(JSON.stringify(data));
export const text = (data) => new Response(String(data));
export const isHttpError = () => false;
export const isRedirect = () => false;
`);

// Demo context: every store AppLayout.svelte setContext()s, seeded with
// realistic Minecraft-server demo data so components render true-to-product.
w(join(SRC_CACHE, 'pano-context.js'), `import { writable } from 'svelte/store';

export const demoUser = {
  id: 1, username: 'Herobrine', email: 'admin@craftrealms.example',
  registerDate: 1735689600000, lastLoginDate: 1751673600000,
  registeredAt: 1735689600000, lastActivityTime: 1751673600000,
  permissionGroup: { id: 1, name: 'admin' }, permissionGroupId: 1,
  admin: true, permissions: [],
  isBanned: false, isEmailVerified: true, mcUuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5',
};
const demoServer = {
  id: 1, name: 'CraftRealms Survival', motd: 'Welcome to CraftRealms!',
  playerCount: 42, maxPlayerCount: 100, host: 'play.craftrealms.example', port: 25565,
  type: 'SPIGOT', platformType: 'SPIGOT', version: '1.21.4', status: 'RUNNING',
  favicon: null, startTime: 1751587200000, stopTime: null, acceptedTime: 1735689600000,
};
const demoWebsite = { name: 'CraftRealms', description: 'A cozy Minecraft community' };
const demoSiteInfo = {
  locale: 'en-US', platformLocale: 'en-US',
  websiteName: 'CraftRealms', websiteDescription: 'A cozy Minecraft community',
  panoVersion: '1.0.0', latestPanoVersion: '1.0.0', platformAddress: 'https://demo.panomc.local',
};
const demoSession = {
  basicData: {
    panelTheme: 'dark', showDevModeAlert: false, locale: 'en-US',
    permissions: [], isAdmin: true,
  },
};

export const panoStores = {
  pageTitle: writable(null),
  resetLayout: writable(false),
  session: writable(demoSession),
  user: writable(demoUser),
  website: writable(demoWebsite),
  siteInfo: writable(demoSiteInfo),
  platformServerMatchKey: writable('DEMO-MATCH-KEY'),
  platformKeyRefreshedTime: writable(1751673600000),
  platformHostAddress: writable('demo.panomc.local'),
  notificationCount: writable(3),
  mainServer: writable(demoServer),
  selectedServer: writable(demoServer),
  connectedServerCount: writable(2),
  sidebarTabsState: writable('website'),
  isSidebarOpen: writable(true),
  platformUpdating: writable(false),
  platformRestarting: writable(false),
  panelTheme: writable('dark'),
  showDevModeAlert: writable(false),
  showSplash: writable(false),
  'layout-slots': writable({}),
};

export const panoContext = new Map(Object.entries(panoStores));
`);

w(join(SRC_CACHE, 'i18n-init.js'), `import { addMessages, init } from 'svelte-i18n';
import en from '${pathToFileURL(join(ROOT, 'lang', 'en-US.json')).pathname}';
addMessages('en-US', en);
init({ fallbackLocale: 'en-US', initialLocale: 'en-US' });
`);

w(join(SRC_CACHE, 'bootstrap-init.js'), `import * as bootstrap from 'bootstrap';
if (typeof window !== 'undefined' && !window.bootstrap) window.bootstrap = bootstrap;
`);

// Runtime store seeding that must happen after i18n init: language stores
// (every Date.svelte consumer crashes on a null currentLanguage), plugin-API
// nav menus (empty until init()), and chart.js animation (screenshots race it).
w(join(SRC_CACHE, 'app-init.js'), `import { currentLanguage, Languages } from '$lib/language.util';
import { init as pluginApiInit } from '$lib/PluginAPI.js';
import { Chart } from 'chart.js';

const en = { code: 'en-US', dateFnsCode: 'enUS', name: 'English' };
currentLanguage.set(en);
Languages.set({ 'en-US': en });
Chart.defaults.animation = false;
pluginApiInit();
`);

const entryLines = [
  `import './bootstrap-init.js';`,
  `import './i18n-init.js';`,
  `import './app-init.js';`,
  `export { panoContext, panoStores } from './pano-context.js';`,
  `export { panoApiClient } from '$lib/PluginAPI.js';`,
  `export { mount, unmount, flushSync, createRawSnippet } from 'svelte';`,
];
comps.forEach((c, i) => {
  entryLines.push(`import C${i}, * as M${i} from ${JSON.stringify(c.path)};`);
});
entryLines.push(`export const __components = { ${comps.map((c, i) => `${c.name}: C${i}`).join(', ')} };`);
entryLines.push(`export const __moduleExports = { ${comps.map((c, i) => `${c.name}: M${i}`).join(', ')} };`);
w(join(SRC_CACHE, 'svelte-entry.js'), entryLines.join('\n') + '\n');

const repoRequire = createRequire(join(ROOT, 'package.json'));
let preprocess;
try {
  const sp = await import(pathToFileURL(repoRequire.resolve('svelte-preprocess')).href);
  preprocess = (sp.default ?? sp)({ scss: { loadPaths: [ROOT, join(ROOT, 'node_modules')], quietDeps: true } });
} catch (e) {
  console.error('[bridge] svelte-preprocess unavailable, continuing without:', e.message);
}

// PluginManager top-level-awaits dynamic imports of node builtins (zip handling
// for installed plugins) — that TLA survives into the bundle and breaks the
// converter's es2020 target. No plugins exist in the DS context; stub the module.
const stubPlugin = {
  name: 'pano-stub',
  setup(b) {
    b.onResolve({ filter: /(^|\/)PluginManager(\.js)?$/ }, (args) => {
      if (!args.importer.includes('pano-sdk') && !args.path.includes('pano-sdk')) return null;
      return { path: join(SRC_CACHE, 'shims', 'node-shim.cjs') };
    });
  },
};

const result = await build({
  entryPoints: [join(SRC_CACHE, 'svelte-entry.js')],
  outfile: join(DIST, 'svelte-lib.js'),
  bundle: true, format: 'esm', platform: 'browser', charset: 'utf8',
  nodePaths: [join(ROOT, 'node_modules')],
  conditions: ['svelte', 'browser'],
  mainFields: ['svelte', 'browser', 'module', 'main'],
  alias: {
    '$app/environment': join(SRC_CACHE, 'shims', 'app-environment.js'),
    '$app/navigation': join(SRC_CACHE, 'shims', 'app-navigation.js'),
    '$app/paths': join(SRC_CACHE, 'shims', 'app-paths.js'),
    '$app/stores': join(SRC_CACHE, 'shims', 'app-stores.js'),
    '$app/state': join(SRC_CACHE, 'shims', 'app-state.js'),
    '@theme-style': join(SRC_CACHE, 'shims', 'empty.js'),
    '$lib/init.libs.js': join(SRC_CACHE, 'shims', 'empty.js'),
    '$lib': join(ROOT, 'src', 'lib'),
    '@sveltejs/kit': join(SRC_CACHE, 'shims', 'sveltejs-kit.js'),
    ...Object.fromEntries(
      ['adm-zip', 'path', 'fs', 'zlib', 'crypto', 'os', 'util', 'stream', 'events', 'buffer', 'url', 'child_process', 'worker_threads',
        'node:path', 'node:fs', 'node:zlib', 'node:crypto', 'node:os', 'node:util', 'node:stream', 'node:events', 'node:buffer', 'node:url']
        .map((m) => [m, join(SRC_CACHE, 'shims', 'node-shim.cjs')])),
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true',
    'import.meta.env.VITE_API_URL': '"/api"',
    'import.meta.env.VITE_UI_URL': '""',
    'import.meta.env.VITE_PANEL_URL': '"/panel"',
    'import.meta.env.VITE_SETUP_URL': '""',
    'import.meta.env.VITE_PANO_WEBSITE_URL': '"https://panomc.com"',
    'import.meta.env.VITE_PANO_WEBSITE_API_URL': '"https://api.panomc.com"',
    'import.meta.env.VITE_PRERELEASE': 'false',
    'import.meta.env.VITE_COOKIE_PREFIX': '"pano_"',
  },
  loader: { '.png': 'dataurl', '.svg': 'dataurl', '.jpg': 'dataurl', '.gif': 'dataurl', '.woff': 'empty', '.woff2': 'empty' },
  plugins: [stubPlugin, esbuildSvelte({ compilerOptions: { css: 'injected' }, ...(preprocess ? { preprocess } : {}) })],
  logLevel: 'warning',
});
console.error('[bridge] stage A ok -> dist/svelte-lib.js');

// ── Stage B: React wrappers + d.ts ────────────────────────────────────────
const wrapperRuntime = `import * as React from 'react';
import { createPortal } from 'react-dom';
import { __components, __moduleExports, panoContext, panoStores, mount, unmount, createRawSnippet } from './svelte-lib.js';
export { panoStores };
export { panoApiClient } from './svelte-lib.js';

const isNode = (v) => React.isValidElement(v) ||
  // arrays count only when they actually contain React elements — a plain
  // string array (accept={['image/*']}) is a Svelte prop, not children
  (Array.isArray(v) && v.some((x) => React.isValidElement(x)) &&
    v.every((x) => React.isValidElement(x) || typeof x === 'string' || typeof x === 'number'));

function sig(props) {
  const seen = new Set();
  const enc = (v) => {
    if (v == null || typeof v !== 'object' && typeof v !== 'function') return v;
    if (typeof v === 'function') return '[fn]';
    if (React.isValidElement(v)) return '[el:' + (typeof v.type === 'string' ? v.type : v.type?.displayName || v.type?.name || '?') + ']';
    if (Array.isArray(v)) return v.map(enc);
    if (seen.has(v)) return '[circular]';
    seen.add(v);
    const o = {};
    for (const k of Object.keys(v)) o[k] = enc(v[k]);
    return o;
  };
  try { return JSON.stringify(enc(props)); } catch { return 'unserializable-' + Math.random(); }
}

function bridge(name) {
  const Comp = __components[name];
  function Wrapped(props) {
    const hostRef = React.useRef(null);
    const [slotEls, setSlotEls] = React.useState({});
    const propsSig = sig(props);
    React.useLayoutEffect(() => {
      const target = hostRef.current;
      if (!target || !Comp) return;
      target.innerHTML = '';
      const svelteProps = {};
      const slotFlags = {};
      for (const k of Object.keys(props)) {
        if (k === 'previewOpen') continue;
        const v = props[k];
        if (isNode(v)) {
          svelteProps[k] = createRawSnippet(() => ({
            render: () => '<div style="display:contents"></div>',
            setup(el) { setSlotEls((s) => (s[k] === el ? s : { ...s, [k]: el })); },
          }));
          // legacy <slot name="k"> resolves $$slots[k] === true to the
          // same-named snippet prop (svelte 5 slot() runtime fallback)
          slotFlags[k === 'children' ? 'default' : k] = true;
        } else svelteProps[k] = v;
      }
      if (Object.keys(slotFlags).length) svelteProps.$$slots = slotFlags;
      let inst;
      try {
        inst = mount(Comp, { target, props: svelteProps, context: panoContext });
      } catch (e) {
        console.error('[pano-bridge] mount failed for ' + name + ':', e);
        target.innerHTML = '';
        return;
      }
      let openTimer;
      if (props.previewOpen) {
        // Render the dialog in-flow: Bootstrap's fixed .modal + body backdrop
        // don't survive card containers. Re-applied on an interval so an
        // imperative show() call (the app's real API) can't undo it.
        const forceOpen = () => {
          for (const el of target.querySelectorAll('.modal')) {
            el.classList.add('show', 'd-block');
            el.classList.remove('fade');
            el.style.position = 'relative';
            el.style.zIndex = 'auto';
            el.removeAttribute('aria-hidden');
          }
          for (const el of target.querySelectorAll('.offcanvas')) el.classList.add('show');
          for (const b of document.querySelectorAll('.modal-backdrop')) b.remove();
          document.body.classList.remove('modal-open');
          document.body.style.removeProperty('overflow');
          document.body.style.removeProperty('padding-right');
        };
        forceOpen();
        openTimer = setInterval(forceOpen, 120);
        setTimeout(() => clearInterval(openTimer), 2000);
      }
      return () => { clearInterval(openTimer); setSlotEls({}); try { unmount(inst); } catch {} };
    }, [propsSig]);
    const portals = [];
    for (const k of Object.keys(slotEls)) {
      if (slotEls[k] && props[k] != null && isNode(props[k]))
        portals.push(createPortal(props[k], slotEls[k], name + ':' + k));
    }
    return React.createElement('div', { ref: hostRef, 'data-pano-component': name }, portals);
  }
  Wrapped.displayName = name;
  const mod = __moduleExports[name];
  if (mod) for (const k of Object.keys(mod)) {
    if (k !== 'default' && !(k in Wrapped)) { try { Wrapped[k] = mod[k]; } catch {} }
  }
  return Wrapped;
}
`;
const wrapperExports = comps.map((c) => `export const ${c.name} = /* @__PURE__ */ bridge(${JSON.stringify(c.name)});`).join('\n');
const surfaceExport = `
// Theme canvas matching the real panel (app.html defaults data-bs-theme="dark").
// Used as the preview provider and available to designs as a page surface.
export const PanoSurface = ({ theme = 'dark', padding = 16, style, children, ...rest }) =>
  React.createElement('div', {
    'data-bs-theme': theme,
    className: 'bg-body text-body',
    style: { padding, minHeight: '100%', ...style },
    ...rest,
  }, children);
PanoSurface.displayName = 'PanoSurface';
`;
w(join(DIST, 'index.js'), wrapperRuntime + '\n' + wrapperExports + '\n' + surfaceExport);

// index.d.ts — the API contract the design agent codes against
const dtsChunks = [`import * as React from 'react';\n`];
const RESERVED = new Set(['children']);
for (const c of comps) {
  const meta = PROPS_MAP[c.name] ?? { props: [], children: null, role: '', group: 'Components' };
  const isModal = meta.group === 'Modals' || /\/modals\//.test(c.path);
  const lines = [];
  for (const p of meta.props ?? []) {
    if (RESERVED.has(p.name)) continue;
    if (!/^[A-Za-z_$][\w$]*$/.test(p.name)) continue;
    const doc = p.default != null ? `  /** default: ${String(p.default).replace(/\*\//g, '*\\/')} */\n` : '';
    lines.push(`${doc}  ${p.name}${p.optional ? '?' : ''}: ${p.type};`);
  }
  const slots = slotProps[c.name] ?? [];
  for (const s of slots) {
    if (s === 'children') continue;
    if ((meta.props ?? []).some((p) => p.name === s)) continue;
    lines.push(`  /** rendered into the component's "${s}" slot */\n  ${s}?: React.ReactNode;`);
  }
  if (meta.children || slots.includes('children')) lines.push(`  /** rendered into the component's default slot */\n  children?: React.ReactNode;`);
  if (isModal) lines.push(`  /** render the modal open and in-flow (previews / static designs) */\n  previewOpen?: boolean;`);
  const statics = (modExports[c.name] ?? [])
    .filter((n) => /^[A-Za-z_$][\w$]*$/.test(n))
    .map((n) => `  /** module-level API (same as the Svelte module export) */\n  ${n}: (...args: any[]) => any;`);
  const role = (meta.role || '').replace(/\*\//g, '*\\/');
  dtsChunks.push(`/** ${role} */
export interface ${c.name}Props {
${lines.join('\n')}
}
export declare const ${c.name}: React.FC<${c.name}Props>${statics.length ? ` & {\n${statics.join('\n')}\n}` : ''};
`);
}
dtsChunks.push(`/** Theme canvas div matching the real panel (dark by default). Wrap page-level designs in this to get the panel's background, text color, and theme tokens. */
export interface PanoSurfaceProps {
  /** Bootstrap color mode: 'dark' (panel default), 'light', or a named Pano theme */
  theme?: 'dark' | 'light' | 'copper' | 'emerald' | 'midnight' | 'crimson';
  padding?: number | string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare const PanoSurface: React.FC<PanoSurfaceProps>;

/** Shared demo context stores (user, siteInfo, selectedServer, ...) every component reads. */
export declare const panoStores: Record<string, { subscribe: (fn: (v: any) => void) => () => void; set?: (v: any) => void }>;

/** The panel's plugin-UI registry (hooks, view slots). Mirrors $lib/PluginAPI.js panoApiClient. */
export declare const panoApiClient: any;
`);
w(join(DIST, 'index.d.ts'), dtsChunks.join('\n'));
console.error('[bridge] stage B ok -> dist/index.js + dist/index.d.ts');

// docs/ — per-component .md the converter binds into <Name>.prompt.md
for (const c of comps) {
  const meta = PROPS_MAP[c.name] ?? {};
  const isModal = meta.group === 'Modals' || /\/modals\//.test(c.path);
  const body = [
    `---`, `category: ${meta.group || 'Components'}`, `---`,
    ``, `${meta.role || c.name}`, ``,
    ...(isModal ? [`Modals render hidden by default (Bootstrap). Pass \`previewOpen\` to render the dialog open and in-flow for static designs${modExports[c.name]?.length ? `, or drive it imperatively via \`${c.name}.${modExports[c.name][0]}(...)\` exactly like the Pano app does` : ''}.`, ``] : []),
    ...(meta.note && meta.feasibility !== 'high' ? [`Note: ${meta.note}`, ``] : []),
  ];
  w(join(DOCS, `${c.name}.md`), body.join('\n'));
}
console.error('[bridge] docs ok');

// ── Stage C: styles + fonts ───────────────────────────────────────────────
execFileSync(join(ROOT, 'node_modules', '.bin', 'sass'),
  [join(ROOT, 'src/styles/style.scss'), join(DIST, 'panel-style.css'),
    `--load-path=${ROOT}`, `--load-path=${join(ROOT, 'node_modules')}`, '--quiet-deps', '--no-source-map', '--style=compressed'],
  { stdio: ['ignore', 'inherit', 'inherit'] });

let css = fs.readFileSync(join(DIST, 'panel-style.css'), 'utf8');
css = css.replaceAll('/panel/assets/webfonts/', 'fonts/').replaceAll('/panel/assets/fonts/', 'fonts/');
const leftover = [...css.matchAll(/url\((['"]?)(\/panel\/[^)'"]+)\1\)/g)].map((m) => m[2]);
if (leftover.length) console.error('[bridge] WARN unresolved /panel/ urls in css:', [...new Set(leftover)].join(', '));
fs.writeFileSync(join(DIST, 'panel-style.css'), css);

// @font-face extraction + font binary copy
const faces = css.match(/@font-face\{[^}]*\}/g) ?? [];
const fontFiles = new Set();
let facesCss = '';
for (const f of faces) {
  facesCss += f.replaceAll('fonts/', './') + '\n';
  for (const m of f.matchAll(/url\((['"]?)fonts\/([^)'"?#]+)/g)) fontFiles.add(m[2]);
}
let copied = 0;
for (const file of fontFiles) {
  for (const srcDir of ['static/assets/webfonts', 'static/assets/fonts']) {
    const src = join(ROOT, srcDir, file);
    if (fs.existsSync(src)) { fs.copyFileSync(src, join(DIST, 'fonts', file)); copied++; break; }
  }
}
const missing = [...fontFiles].filter((f) => !fs.existsSync(join(DIST, 'fonts', f)));
if (missing.length) console.error('[bridge] WARN font files not found:', missing.join(', '));
w(join(DIST, 'fonts', 'pano-fonts.css'), facesCss);
console.error(`[bridge] stage C ok -> panel-style.css (${(css.length / 1024).toFixed(0)}KB), ${copied} font files`);

// @types/react + react resolvable from inside bridge-pkg (ts-morph roots there)
const pkgNm = join(PKG, 'node_modules');
fs.mkdirSync(join(pkgNm, '@types'), { recursive: true });
for (const [link, target] of [
  [join(pkgNm, '@types', 'react'), join(ROOT, '.ds-sync', 'node_modules', '@types', 'react')],
  [join(pkgNm, 'react'), join(ROOT, '.ds-sync', 'node_modules', 'react')],
]) { try { fs.symlinkSync(target, link, 'dir'); } catch {} }

// ── package.json ──────────────────────────────────────────────────────────
w(join(PKG, 'package.json'), JSON.stringify({
  name: '@panomc/panel-ui',
  version: '1.0.0',
  private: true,
  type: 'module',
  main: 'dist/index.js',
  module: 'dist/index.js',
  types: 'dist/index.d.ts',
}, null, 2));
console.error('[bridge] done -> ' + relative(ROOT, PKG));
