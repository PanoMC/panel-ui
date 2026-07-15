/**
 * Host runtime registry.
 *
 * This module is evaluated by SvelteKit at client startup, before hydration and
 * before any plugin code runs. It exposes the HOST bundle's own module instances
 * (svelte, svelte-i18n, @panomc/sdk) through globalThis.__PANO_RUNTIME__ so the
 * static/runtime/* shim modules — which the import map resolves plugins' bare
 * specifiers to — can re-export the exact same instances. One Svelte runtime on
 * the page: host pages and plugin components share the same effect scheduler,
 * component context and store implementations, and plugins download no second
 * runtime copy during hydration.
 *
 * The thunks are lazy on purpose: modules with import side effects (e.g.
 * svelte/internal/flags/async flips a global runtime flag) only execute when a
 * plugin actually imports them, matching normal ESM semantics.
 *
 * Keys MUST stay in sync with scripts/generate-runtime-shims.js and the import
 * map in src/hooks.server.js.
 */
import { browser } from '$app/environment';

const runtimeModules = {
  'svelte': () => import('svelte'),
  'svelte/animate': () => import('svelte/animate'),
  'svelte/easing': () => import('svelte/easing'),
  'svelte/motion': () => import('svelte/motion'),
  'svelte/store': () => import('svelte/store'),
  'svelte/transition': () => import('svelte/transition'),
  'svelte/internal': () => import('svelte/internal'),
  'svelte/internal/client': () => import('svelte/internal/client'),
  'svelte/internal/disclose-version': () => import('svelte/internal/disclose-version'),
  'svelte/internal/flags/legacy': () => import('svelte/internal/flags/legacy'),
  'svelte/internal/flags/async': () => import('svelte/internal/flags/async'),
  'svelte/internal/flags/tracing': () => import('svelte/internal/flags/tracing'),
  'svelte/legacy': () => import('svelte/legacy'),
  'svelte/events': () => import('svelte/events'),
  'svelte/attachments': () => import('svelte/attachments'),
  'svelte/reactivity': () => import('svelte/reactivity'),
  'svelte/reactivity/window': () => import('svelte/reactivity/window'),
  'svelte-i18n': () => import('svelte-i18n'),
  '@panomc/sdk': () => import('@panomc/sdk'),
  '@panomc/sdk/components/theme': () => import('@panomc/sdk/components/theme'),
  '@panomc/sdk/components/panel': () => import('@panomc/sdk/components/panel'),
  '@panomc/sdk/toasts': () => import('@panomc/sdk/toasts'),
  '@panomc/sdk/utils/api': () => import('@panomc/sdk/utils/api'),
  '@panomc/sdk/utils/auth': () => import('@panomc/sdk/utils/auth'),
  '@panomc/sdk/utils/tooltip': () => import('@panomc/sdk/utils/tooltip'),
  '@panomc/sdk/utils/language': () => import('@panomc/sdk/utils/language'),
  '@panomc/sdk/utils/component': () => import('@panomc/sdk/utils/component'),
  '@panomc/sdk/utils/text': () => import('@panomc/sdk/utils/text'),
  '@panomc/sdk/variables': () => import('@panomc/sdk/variables'),
  '@panomc/sdk/svelte': () => import('@panomc/sdk/svelte'),
  '@panomc/sdk/internal': () => import('@panomc/sdk/internal'),
};

const moduleCache = new Map();

if (browser) {
  const g = globalThis;

  g.__PANO_RUNTIME__ = {
    import(specifier) {
      const thunk = runtimeModules[specifier];
      if (!thunk) {
        return Promise.reject(
          new Error(`[pano-runtime] '${specifier}' is not provided by the host runtime registry`),
        );
      }
      let cached = moduleCache.get(specifier);
      if (!cached) {
        cached = thunk();
        moduleCache.set(specifier, cached);
      }
      return cached;
    },
  };

  // Wake up any shim that was evaluated before this module (it awaits this promise).
  g.__PANO_RT_RESOLVE__?.(g.__PANO_RUNTIME__);
}

/** @type {import('@sveltejs/kit').ClientInit} */
export async function init() {
  // Hydration succeeded far enough to run app code: disarm the watchdog for this
  // document (post-boot module failures must not reload), re-arm the one-shot
  // reload guard for the NEXT document, and drop the cache-busting marker.
  globalThis.__PANO_APP_BOOTED__ = true;

  try {
    sessionStorage.removeItem('pano:hydration-reload');
  } catch {
    /* sessionStorage unavailable (e.g. blocked); the watchdog degrades gracefully */
  }

  try {
    const url = new URL(location.href);
    if (url.searchParams.has('pano-rl')) {
      url.searchParams.delete('pano-rl');
      history.replaceState(history.state, '', url);
    }
  } catch {
    /* non-critical cleanup */
  }
}
