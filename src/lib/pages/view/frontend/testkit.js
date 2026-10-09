/**
 * Test support for the Front-end page: renders the real `.svelte` components on the server with
 * the real lang files, and gives the tests a stubbed panel API.
 *
 * Bun does not compile Svelte, so importing this file first registers a loader for `.svelte` files
 * (the Svelte compiler, `generate: 'server'`). The SvelteKit-only aliases (`$app/*`) are stubbed.
 * Import it before any component.
 */
import { plugin } from 'bun';
import { mock } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { writable } from 'svelte/store';
import { addMessages, init, waitLocale } from 'svelte-i18n';

plugin({
  name: 'svelte-server',
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, ({ path }) => {
      const { js } = compile(readFileSync(path, 'utf8'), {
        generate: 'server',
        filename: path,
        dev: false,
      });

      return { contents: js.code, loader: 'js' };
    });
  },
});

mock.module('$app/paths', () => ({ base: '', assets: '' }));
mock.module('$app/environment', () => ({ browser: false, dev: false, building: false }));
mock.module('$app/navigation', () => ({
  goto: async () => {},
  invalidate: async () => {},
  invalidateAll: async () => {},
  beforeNavigate: () => {},
}));
mock.module('$app/stores', () => ({
  page: writable({ url: new URL('http://localhost/panel/view/frontend'), data: {} }),
  navigating: writable(null),
}));

const LANG_DIR = join(import.meta.dir, '../../../../../lang');

/** @param {string} locale */
export function readLang(locale) {
  return JSON.parse(readFileSync(join(LANG_DIR, `${locale}.json`), 'utf8'));
}

/** Loads the lang file of a locale into svelte-i18n and makes it the current one. */
export async function useLocale(locale = 'en-US') {
  addMessages(locale, readLang(locale));
  await init({ fallbackLocale: 'en-US', initialLocale: locale });
  await waitLocale(locale);
}

/**
 * Server-renders a component and returns its markup.
 * @param {any} Component
 * @param {Record<string, any>} [props]
 * @returns {string}
 */
export function renderHtml(Component, props = {}) {
  return render(Component, { props }).body;
}

/** The text of rendered markup: tags and Svelte's hydration comments removed, spaces collapsed. */
export function textOf(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A stubbed panel API client for `createFrontendApi`: every call is recorded and answered by the
 * handler registered for `METHOD /path`; an unregistered call answers `{}`.
 *
 * @param {Record<string, any | ((options: any) => any)>} [answers]
 */
export function stubClient(answers = {}) {
  /** @type {Array<{ method: string, path: string, body: any }>} */
  const calls = [];

  const call = (method) => async (options) => {
    const route = `${method} ${options.path}`;

    calls.push({ method, path: options.path, body: options.body });

    const answer = answers[route];

    return typeof answer === 'function' ? answer(options) : (answer ?? {});
  };

  return {
    calls,
    get: call('GET'),
    post: call('POST'),
    put: call('PUT'),
    delete: call('DELETE'),
  };
}

/** A notifier that records what the page would have shown as a toast. */
export function recordingNotify() {
  /** @type {Array<{ type: 'success' | 'error', key: string, values: any }>} */
  const toasts = [];

  return {
    toasts,
    success: (key, values = {}) => toasts.push({ type: 'success', key, values }),
    error: (key, values = {}) => toasts.push({ type: 'error', key, values }),
  };
}

/** A confirm dialog stand-in that records the dialog and runs the callback at once (the user said yes). */
export function autoConfirm() {
  /** @type {any[]} */
  const dialogs = [];

  return {
    dialogs,
    confirm: (options, callback) => {
      dialogs.push(options);

      return callback();
    },
  };
}
