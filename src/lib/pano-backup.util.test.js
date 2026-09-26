import { describe, expect, test } from 'bun:test';

import {
  ENVELOPE_MAGIC,
  describeError,
  inspectArchiveFile,
  inspectArchiveHeader,
  isTransferOpen,
  jobPercent,
  passphraseProblem,
  pollDelay,
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
  test('unwraps PANO_HOST_ERROR and picks the quota reason', () => {
    const at = Date.UTC(2026, 8, 26, 12, 0, 0);
    const result = describeError(
      {
        error: 'PANO_HOST_ERROR',
        hostError: 'QUOTA_EXCEEDED',
        reason: 'FREQUENCY',
        nextAllowedAt: at,
      },
      { locale: 'en-US' },
    );

    expect(result?.code).toBe('QUOTA_EXCEEDED_FREQUENCY');
    expect(result?.key).toBe('pages.settings.backups.errors.QUOTA_EXCEEDED_FREQUENCY');
    expect(result?.values.nextAllowedAt).toBe(new Date(at).toLocaleString('en-US'));
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

  test('pollDelay and isTransferOpen', () => {
    expect(pollDelay(undefined)).toBe(5000);
    expect(pollDelay(1)).toBe(2000);
    expect(pollDelay(120)).toBe(30000);
    expect(isTransferOpen('AWAITING_CONFIRMATION')).toBe(true);
    expect(isTransferOpen('DONE')).toBe(false);
  });
});
