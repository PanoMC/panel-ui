import { derived, get, writable } from 'svelte/store';

import ApiUtil from '$lib/api.util.js';

/**
 * Pano+ for this panel, from `GET /api/v1/panel/pano-plus`. Stays `null` until the answer is in and
 * when the request fails: nothing about Pano+ shows then.
 *
 * @type {import('svelte/store').Writable<null | {
 *   enabled: boolean, priceMonthly: string | null, currency: string | null,
 *   benefits: Record<string, number>, me: null | { active: boolean, status: string, renewsAt: number | null, graceUntil: number | null },
 *   hintsDismissed: boolean, plusUrl: string | null }>}
 */
export const panoPlus = writable(null);

let loading = null;

/** Loads the Pano+ info once per page load; `refresh` asks panomc.com for a fresh answer. */
export function loadPanoPlus(refresh = false) {
  if (loading && !refresh) return loading;

  loading = ApiUtil.get({ path: '/panel/pano-plus' + (refresh ? '?refresh=true' : '') })
    .then((body) => {
      panoPlus.set(body && !body.error ? body : null);
    })
    .catch(() => {
      panoPlus.set(null);
    });

  return loading;
}

/** True when Pano+ is on and the panel has an address to send people to. */
export function isPanoPlusOn(info) {
  return !!(info && info.enabled === true && info.plusUrl);
}

/** Hints show to a Pano that does not have Pano+ yet, until any hint is closed once. */
export function showsPanoPlusHints(info) {
  return isPanoPlusOn(info) && info.hintsDismissed !== true && info.me?.active !== true;
}

/** The grace bar shows while the subscription has ended and the grace runs. */
export function showsPanoPlusGrace(info) {
  return isPanoPlusOn(info) && info.me?.status === 'GRACE';
}

/** Whole days left until [at] (rounded up), at least 0; null without a date. */
export function daysLeft(at, now = Date.now()) {
  if (typeof at !== 'number') return null;

  return Math.max(0, Math.ceil((at - now) / (24 * 60 * 60 * 1000)));
}

/** When Pano+ access runs to: the grace end in the grace, else the renewal date. */
export function panoPlusUntil(info) {
  const me = info?.me;

  if (!me?.active) return null;

  return (me.status === 'GRACE' ? me.graceUntil : me.renewsAt) ?? null;
}

export const panoPlusHintsVisible = derived(panoPlus, showsPanoPlusHints);
export const panoPlusGraceVisible = derived(panoPlus, showsPanoPlusGrace);

/** Closing any hint turns every Pano+ hint off on this Pano for good. */
export function dismissPanoPlusHints() {
  const current = get(panoPlus);

  if (current) panoPlus.set({ ...current, hintsDismissed: true });

  return ApiUtil.post({ path: '/panel/pano-plus/hints/dismiss' }).catch(() => {});
}
