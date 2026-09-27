import { describe, expect, test } from 'bun:test';

import {
  ENVELOPE_MAGIC,
  MANAGE_BACKUPS_URL,
  REMOTE_SCHEDULES,
  accountUsage,
  canRestoreRemote,
  connectionState,
  describeError,
  groupRemoteBackups,
  manageBackupsUrl,
  usageColour,
  inspectArchiveFile,
  inspectArchiveHeader,
  isTransferOpen,
  jobPercent,
  passphraseProblem,
  toggleId,
  usagePercent,
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

  test('schedules have no plan-paced option and isTransferOpen', () => {
    expect([...REMOTE_SCHEDULES]).toEqual(['OFF', 'DAILY', 'WEEKLY']);
    expect(isTransferOpen('AWAITING_CONFIRMATION')).toBe(true);
    expect(isTransferOpen('DONE')).toBe(false);
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

  test('manageBackupsUrl follows the API host, else panomc.com', () => {
    expect(manageBackupsUrl('https://api.panomc.com')).toBe(MANAGE_BACKUPS_URL);
    expect(manageBackupsUrl('https://api.example.org/api')).toBe(
      'https://example.org/host/manage/backups',
    );
    expect(manageBackupsUrl('http://127.0.0.1:18102/api')).toBe(MANAGE_BACKUPS_URL);
    expect(manageBackupsUrl(null)).toBe(MANAGE_BACKUPS_URL);
    expect(manageBackupsUrl('https://api.panomc.com', 'instances')).toBe(
      'https://panomc.com/host/manage/instances',
    );
  });

  test('groupRemoteBackups puts this Pano first and hides failed or stopped rows', () => {
    const groups = groupRemoteBackups({
      instanceId: 'me',
      panos: [
        {
          instanceId: 'other',
          instanceName: 'Other',
          connected: false,
          backups: [
            { id: 'o1', status: 'DONE', kind: 'pano-instance' },
            { id: 'o2', status: 'CANCELED' },
          ],
        },
        { instanceId: 'empty', backups: [{ id: 'e1', status: 'FAILED' }] },
        { instanceId: 'me', instanceName: 'Mine', current: true, backups: [] },
      ],
    });

    expect(groups.map((group) => group.instanceId)).toEqual(['me', 'other']);
    expect(groups[0].current).toBe(true);
    expect(groups[1].connected).toBe(false);
    expect(groups[1].backups.map((backup) => backup.id)).toEqual(['o1']);
    expect(groupRemoteBackups(null)).toEqual([]);
  });

  test('canRestoreRemote: finished Pano backups of any Pano, never MC server backups', () => {
    expect(canRestoreRemote({ status: 'DONE', kind: 'pano-instance', own: false })).toBe(true);
    expect(canRestoreRemote({ status: 'UPLOADING', kind: 'pano-instance' })).toBe(false);
    expect(canRestoreRemote({ status: 'DONE', kind: 'mc-server' })).toBe(false);
  });
});
