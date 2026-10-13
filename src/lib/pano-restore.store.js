import { writable } from 'svelte/store';

/**
 * The running Pano restore job (`GET /panel/pano-backups/job` shape), or null. While it is set the
 * panel is locked behind `RestoreProgressModal` (mounted by `AppLayout`), which also keeps it up to date.
 *
 * @type {import('svelte/store').Writable<any>}
 */
export const restoreJob = writable(null);

/** @param {any} job */
export function isRunningRestore(job) {
  return !!job && job.type === 'RESTORE' && job.status === 'RUNNING';
}
