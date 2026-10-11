import { describe, expect, test } from 'bun:test';
import { formatBytes } from './string.util.js';

import {
  ENVELOPE_MAGIC,
  REMOTE_SCHEDULES,
  formatSpeed,
  jobSpeed,
  resendWaitSeconds,
  transferFits,
  accountUsage,
  canRestoreRemote,
  connectionState,
  describeError,
  canDownloadSnapshot,
  snapshotDownloadUrl,
  hostManageUrl,
  backupPlanUrl,
  usageColour,
  inspectArchiveFile,
  waitForRestart,
  inspectArchiveHeader,
  jobPercent,
  passphraseProblem,
  toggleId,
  usagePercent,
  BACKUP_MODES,
  normaliseMode,
  formatSnapshotBytes,
  canRestoreSnapshot,
  canDeleteSnapshot,
  snapshotProblem,
} from './pano-backup.util.js';

/** @param {object} header */
function envelope(header, { cut = 0 } = {}) {
  const json = new TextEncoder().encode(JSON.stringify(header));
  const bytes = new Uint8Array(ENVELOPE_MAGIC.length + 4 + json.length + 16);

  bytes.set(ENVELOPE_MAGIC, 0);
  new DataView(bytes.buffer).setUint32(ENVELOPE_MAGIC.length, json.length, false);
  bytes.set(json, ENVELOPE_MAGIC.length + 4);

  return cut ? bytes.slice(0, cut) : bytes;
}

describe('inspectArchiveHeader', () => {
  test('recognises a passphrase envelope and reads its keyMode', () => {
    const result = inspectArchiveHeader(
      envelope({ alg: 'AES-256-GCM-STREAM', keyMode: 'passphrase' }),
    );

    expect(result).toEqual({ type: 'encrypted', keyMode: 'passphrase' });
  });

  test('an envelope whose header is cut off is still encrypted, keyMode unknown', () => {
    const result = inspectArchiveHeader(envelope({ keyMode: 'workload' }, { cut: 14 }));

    expect(result).toEqual({ type: 'encrypted', keyMode: null });
  });

  test('a broken or oversized header length does not throw', () => {
    const bytes = envelope({ keyMode: 'passphrase' });

    new DataView(bytes.buffer).setUint32(ENVELOPE_MAGIC.length, 0xffffffff, false);

    expect(inspectArchiveHeader(bytes)).toEqual({ type: 'encrypted', keyMode: null });

    const garbage = envelope({ keyMode: 'passphrase' });
    garbage[ENVELOPE_MAGIC.length + 4] = 0x7b + 1; // not JSON any more

    expect(inspectArchiveHeader(garbage).type).toBe('encrypted');
  });

  test('a zip is a plain archive, anything else is unknown', () => {
    expect(inspectArchiveHeader([0x50, 0x4b, 3, 4, 0, 0]).type).toBe('plain');
    expect(inspectArchiveHeader([0x50, 0x41, 0x4e, 0x4f]).type).toBe('unknown');
    expect(inspectArchiveHeader(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9])).type).toBe('unknown');
    expect(inspectArchiveHeader(null).type).toBe('unknown');
  });

  test('inspectArchiveFile reads only the start of a Blob', async () => {
    const blob = new Blob([envelope({ keyMode: 'passphrase' }), new Uint8Array(64 * 1024)]);

    expect(await inspectArchiveFile(blob)).toEqual({ type: 'encrypted', keyMode: 'passphrase' });
  });
});

describe('describeError', () => {
  test('a quota refusal of a transfer says the Pano does not fit the instance', () => {
    const result = describeError(
      { error: 'QUOTA_EXCEEDED', details: { maxBytes: 1048576 } },
      { context: 'transfer' },
    );

    expect(result?.key).toBe('pages.settings.backups.errors.QUOTA_EXCEEDED_TRANSFER');
    expect(result?.values.max).toBe(formatBytes(1048576));
    expect(describeError({ error: 'QUOTA_EXCEEDED' })?.code).toBe('QUOTA_EXCEEDED');
  });

  test('unwraps PANO_HOST_ERROR and picks the payment reason with its grace end', () => {
    const at = Date.UTC(2026, 8, 26, 12, 0, 0);
    const result = describeError(
      { error: 'PANO_HOST_ERROR', hostError: 'PAYMENT_REQUIRED', reason: 'LAPSED', graceUntil: at },
      { locale: 'en-US' },
    );

    expect(result?.code).toBe('PAYMENT_REQUIRED_LAPSED');
    expect(result?.key).toBe('pages.settings.backups.errors.PAYMENT_REQUIRED_LAPSED');
    expect(result?.values.graceUntil).toBe(new Date(at).toLocaleString('en-US'));
    expect(
      describeError({ error: 'PAYMENT_REQUIRED', details: { reason: 'NO_SUBSCRIPTION' } })?.code,
    ).toBe('PAYMENT_REQUIRED_NO_SUBSCRIPTION');
  });

  test('reads the error envelope of a response body', () => {
    const at = Date.UTC(2026, 8, 26, 12, 0, 0);
    const result = describeError(
      {
        error: {
          code: 'PANO_HOST_ERROR',
          details: { hostError: 'PAYMENT_REQUIRED', reason: 'LAPSED', graceUntil: at },
        },
      },
      { locale: 'en-US' },
    );

    expect(result?.code).toBe('PAYMENT_REQUIRED_LAPSED');
    expect(result?.values.graceUntil).toBe(new Date(at).toLocaleString('en-US'));
    expect(describeError({ error: { code: 'SOMETHING_NEW' } })?.key).toBe(
      'pages.settings.backups.errors.generic',
    );
  });

  test('connection and remote-stop errors have their own sentence', () => {
    expect(
      describeError({
        error: 'PANO_HOST_ERROR',
        hostError: 'CONNECT_REQUIRED',
        reason: 'INVALID_TOKEN',
      })?.key,
    ).toBe('pages.settings.backups.errors.CONNECT_REQUIRED');
    expect(describeError({ error: 'STOPPED_REMOTELY', details: { backupId: 'b1' } })?.key).toBe(
      'pages.settings.backups.errors.STOPPED_REMOTELY',
    );
  });

  test('reads job errors with their details', () => {
    const result = describeError({
      error: 'QUOTA_EXCEEDED',
      details: { reason: 'QUOTA', quotaBytes: 1024, usedBytes: 2048 },
    });

    expect(result?.code).toBe('QUOTA_EXCEEDED_QUOTA');
    expect(result?.values.quota).toBe('1 KB');
    expect(result?.values.used).toBe('2 KB');
  });

  test('an unknown reason keeps the general code, unknown codes use the generic key', () => {
    expect(describeError({ error: 'QUOTA_EXCEEDED', reason: 'SOMETHING' })?.code).toBe(
      'QUOTA_EXCEEDED',
    );

    const unknown = describeError({ error: 'SOMETHING_NEW' });

    expect(unknown?.key).toBe('pages.settings.backups.errors.generic');
    expect(unknown?.values.code).toBe('SOMETHING_NEW');
  });

  test('no error, no description', () => {
    expect(describeError(null)).toBeNull();
    expect(describeError({ result: 'ok' })).toBeNull();
  });
});

describe('small rules', () => {
  test('jobPercent', () => {
    expect(jobPercent(null)).toBeNull();
    expect(jobPercent({ bytesDone: 5, bytesTotal: 0 })).toBeNull();
    expect(jobPercent({ bytesDone: 50, bytesTotal: 200 })).toBe(25);
    expect(jobPercent({ bytesDone: 500, bytesTotal: 200 })).toBe(100);
  });

  test('usagePercent', () => {
    expect(usagePercent({ usedBytes: 1, quotaBytes: 0 })).toBeNull();
    expect(usagePercent({ usedBytes: 1, quotaBytes: 3 })).toBe(33);
    expect(usagePercent({ used: 1, reserved: 1, quota: 4 })).toBe(50);
    expect(usagePercent(null)).toBeNull();
  });

  test('usageColour', () => {
    expect(usageColour(null)).toBe('primary');
    expect(usageColour(80)).toBe('warning');
    expect(usageColour(95)).toBe('danger');
  });

  test('passphraseProblem', () => {
    expect(passphraseProblem('short', 'short')).toBe('too-short');
    expect(passphraseProblem('long enough', 'long enougH')).toBe('mismatch');
    expect(passphraseProblem('long enough', 'long enough')).toBeNull();
  });

  test('toggleId', () => {
    expect(toggleId([3, 1], 2)).toEqual([1, 2, 3]);
    expect(toggleId(['1', 2], 1)).toEqual([2]);
    expect(toggleId([], 'x')).toEqual([]);
  });

  test('schedules have no plan-paced option', () => {
    expect([...REMOTE_SCHEDULES]).toEqual(['OFF', 'DAILY', 'WEEKLY']);
  });
});

describe('connected account', () => {
  test('accountUsage reads both the panel and the control-plane shape', () => {
    expect(accountUsage(null)).toBeNull();
    expect(accountUsage({ used: 30, reserved: 10, quota: 100, free: 60 })).toEqual({
      used: 30,
      reserved: 10,
      quota: 100,
      free: 60,
      percent: 40,
    });
    expect(accountUsage({ usedBytes: 50, reservedBytes: 0, quotaBytes: 100 })?.free).toBe(50);
    expect(accountUsage({ used: 5, quota: null })).toEqual({
      used: 5,
      reserved: 0,
      quota: null,
      free: null,
      percent: null,
    });
    expect(accountUsage({ used: 500, quota: 100 })?.percent).toBe(100);
  });

  test('connectionState', () => {
    expect(connectionState(null)).toBe('not-connected');
    expect(connectionState({ connected: false })).toBe('not-connected');
    expect(connectionState({ connected: true })).toBe('connected');
    expect(
      connectionState({ connected: true, hostError: { code: 'CONNECT_REQUIRED', reason: 'X' } }),
    ).toBe('not-connected');
    expect(connectionState({ connected: true, hostError: { code: 'UNAVAILABLE' } })).toBe(
      'unavailable',
    );
  });

  test('backupPlanUrl sends the backups page along as panoCallback', () => {
    expect(backupPlanUrl('https://local.panomc.com:3003/', 'https://my.pano/panel/backups')).toBe(
      'https://local.panomc.com:3003/host/manage/backups?panoCallback=https%3A%2F%2Fmy.pano%2Fpanel%2Fbackups',
    );
    expect(backupPlanUrl('', 'x')).toBe('https://panomc.com/host/manage/backups?panoCallback=x');
  });

  test('hostManageUrl uses the configured Pano website', () => {
    expect(hostManageUrl('https://local.panomc.com:3003/', 'instances')).toBe(
      'https://local.panomc.com:3003/host/manage/instances',
    );
    expect(hostManageUrl(null)).toBe('https://panomc.com/host/manage/backups');
  });

  test('canRestoreRemote: finished Pano backups of any Pano, never MC server backups', () => {
    expect(canRestoreRemote({ status: 'DONE', kind: 'pano-instance', own: false })).toBe(true);
    expect(canRestoreRemote({ status: 'UPLOADING', kind: 'pano-instance' })).toBe(false);
    expect(canRestoreRemote({ status: 'DONE', kind: 'mc-server' })).toBe(false);
  });
});

describe('waitForRestart', () => {
  const clock = () => {
    let time = 0;

    return { now: () => time, sleep: async (ms) => void (time += ms) };
  };

  test('waits until Pano went down and answers again', async () => {
    const answers = [true, false, false, true];
    let probes = 0;

    const done = await waitForRestart({ ...clock(), probe: async () => answers[probes++] });

    expect(done).toBe(true);
    expect(probes).toBe(4);
  });

  test('a failing probe counts as down', async () => {
    let probes = 0;

    const done = await waitForRestart({
      ...clock(),
      probe: async () => {
        if (probes++ === 0) throw new Error('refused');

        return true;
      },
    });

    expect(done).toBe(true);
    expect(probes).toBe(2);
  });

  test('a Pano that never goes down is taken as up after the grace period', async () => {
    const time = clock();

    expect(
      await waitForRestart({ ...time, probe: async () => true, intervalMs: 1000, graceMs: 5000 }),
    ).toBe(true);
    expect(time.now()).toBe(5000);
  });

  test('gives up after the timeout', async () => {
    expect(await waitForRestart({ ...clock(), probe: async () => false, timeoutMs: 6000 })).toBe(
      false,
    );
  });
});

describe('snapshots', () => {
  test('the backup type defaults to snapshot', () => {
    expect(BACKUP_MODES).toEqual(['SNAPSHOT', 'FULL']);
    expect(normaliseMode('FULL')).toBe('FULL');
    expect(normaliseMode('SNAPSHOT')).toBe('SNAPSHOT');
    expect(normaliseMode(undefined)).toBe('SNAPSHOT');
    expect(normaliseMode('nope')).toBe('SNAPSHOT');
  });

  test('sizes are short, missing ones a dash', () => {
    expect(formatSnapshotBytes(0)).toBe('0 B');
    expect(formatSnapshotBytes(1536)).toBe('1.5 KB');
    expect(formatSnapshotBytes(null)).toBe('—');
    expect(formatSnapshotBytes(undefined)).toBe('—');
    expect(formatSnapshotBytes(-1)).toBe('—');
  });

  test('restore needs a finished snapshot, delete an own finished or failed one', () => {
    expect(canRestoreSnapshot({ status: 'DONE' })).toBe(true);
    expect(canRestoreSnapshot({ status: 'RUNNING' })).toBe(false);
    expect(canDeleteSnapshot({ status: 'DONE', own: true })).toBe(true);
    expect(canDeleteSnapshot({ status: 'FAILED', own: true })).toBe(true);
    expect(canDeleteSnapshot({ status: 'DONE', own: false })).toBe(false);
    expect(canDeleteSnapshot({ status: 'RUNNING', own: true })).toBe(false);
  });

  test('a full storage is its own reason, other failures use the usual texts', () => {
    expect(snapshotProblem({ status: 'DONE' })).toBeNull();
    expect(snapshotProblem({ status: 'FAILED', error: 'QUOTA_EXCEEDED' })).toEqual({
      key: 'pages.settings.backups.snapshot.storage-full',
      values: {},
      storageFull: true,
    });
    expect(snapshotProblem({ status: 'FAILED', error: 'PAYMENT_REQUIRED' })?.key).toBe(
      'pages.settings.backups.errors.PAYMENT_REQUIRED',
    );
    expect(snapshotProblem({ status: 'FAILED', error: 'WHATEVER' })?.key).toBe(
      'pages.settings.backups.snapshot.failed',
    );
    expect(snapshotProblem({ status: 'FAILED', error: null })?.storageFull).toBe(false);
  });

  test('canDownloadSnapshot: finished snapshots of any Pano, nothing else', () => {
    expect(canDownloadSnapshot({ status: 'DONE', own: false })).toBe(true);
    expect(canDownloadSnapshot({ status: 'RUNNING' })).toBe(false);
    expect(canDownloadSnapshot({ status: 'FAILED' })).toBe(false);
    expect(canDownloadSnapshot(null)).toBe(false);
    expect(snapshotDownloadUrl('a/b')).toBe('/api/v1/panel/pano-backups/remote/downloads/a%2Fb');
  });
});

describe('job progress helpers', () => {
  test('jobSpeed measures over a window, per phase, and is null when nothing moves', () => {
    let state = jobSpeed([], { at: 0, bytes: 0, phase: 'UPLOADING' });

    expect(state.bytesPerSecond).toBeNull();

    state = jobSpeed(state.samples, { at: 2000, bytes: 2_000_000, phase: 'UPLOADING' });
    expect(state.bytesPerSecond).toBe(1_000_000);

    // A part boundary does not make it jump: the window still spans the earlier samples.
    state = jobSpeed(state.samples, { at: 4000, bytes: 2_000_000, phase: 'UPLOADING' });
    expect(state.bytesPerSecond).toBe(500_000);

    // Old samples fall out of the ten second window; no movement left means no speed.
    state = jobSpeed(state.samples, { at: 20_000, bytes: 2_000_000, phase: 'UPLOADING' });
    state = jobSpeed(state.samples, { at: 22_000, bytes: 2_000_000, phase: 'UPLOADING' });
    expect(state.bytesPerSecond).toBeNull();

    // A new phase (or a counter that went back) starts over.
    state = jobSpeed(state.samples, { at: 23_000, bytes: 0, phase: 'RESTORING' });
    expect(state.samples).toHaveLength(1);
    expect(state.bytesPerSecond).toBeNull();
  });

  test('formatSpeed and jobPercent', () => {
    expect(formatSpeed(null)).toBe('');
    expect(formatSpeed(0)).toBe('');
    expect(formatSpeed(1_048_576)).toBe(`${formatBytes(1_048_576)}/s`);
    expect(jobPercent({ bytesDone: 50, bytesTotal: 200 })).toBe(25);
    expect(jobPercent({ bytesTotal: 0, percent: 40.4 })).toBe(40);
    expect(jobPercent({ bytesTotal: 0, percent: null })).toBeNull();
    expect(jobPercent({ bytesTotal: 0 })).toBeNull();
  });

  test('resendWaitSeconds counts down to the time the next code may be asked for', () => {
    expect(resendWaitSeconds(1_800_000_060, 1_800_000_000_000)).toBe(60);
    expect(resendWaitSeconds(1_800_000_060_000, 1_800_000_000_000)).toBe(60);
    expect(resendWaitSeconds(1_800_000_060_000, 1_800_000_070_000)).toBe(0);
    expect(resendWaitSeconds(null, 0)).toBe(0);
  });
});

describe('transferFits', () => {
  test('only a known estimate above a known limit says no', () => {
    expect(transferFits(500, 1000)).toBe(true);
    expect(transferFits(1000, 1000)).toBe(true);
    expect(transferFits(1001, 1000)).toBe(false);
    expect(transferFits(null, 1000)).toBeNull();
    expect(transferFits(500, null)).toBeNull();
    expect(transferFits(500, 0)).toBeNull();
    expect(transferFits(undefined, undefined)).toBeNull();
  });
});
