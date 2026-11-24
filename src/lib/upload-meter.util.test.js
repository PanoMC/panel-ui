import { describe, expect, it } from 'bun:test';

import {
  archiveFormatOf,
  createUploadMeter,
  stripArchiveExtension,
  taskErrorCode,
} from './upload-meter.util.js';

/** @param {number[]} head @param {number} [offset] */
function bytes(head, offset = 0) {
  const out = new Uint8Array(512);

  out.set(head, offset);

  return out;
}

describe('archiveFormatOf', () => {
  it('reads the magic numbers', () => {
    expect(archiveFormatOf(bytes([0x50, 0x4b, 0x03, 0x04]))).toBe('zip');
    expect(archiveFormatOf(bytes([0x50, 0x4b, 0x05, 0x06]))).toBe('zip');
    expect(archiveFormatOf(bytes([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]))).toBe('7z');
    expect(archiveFormatOf(bytes([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]))).toBe('rar');
    expect(archiveFormatOf(bytes([0x42, 0x5a, 0x68]))).toBe('tar.bz2');
    expect(archiveFormatOf(bytes([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]))).toBe('tar.xz');
    expect(archiveFormatOf(bytes([0x75, 0x73, 0x74, 0x61, 0x72], 257))).toBe('tar');
  });

  it('calls gzip a tarball only when the name says so', () => {
    expect(archiveFormatOf(bytes([0x1f, 0x8b]), 'world.tar.gz')).toBe('tar.gz');
    expect(archiveFormatOf(bytes([0x1f, 0x8b]), 'world.tgz')).toBe('tar.gz');
    expect(archiveFormatOf(bytes([0x1f, 0x8b]), 'world.gz')).toBe('gz');
  });

  it('refuses anything else', () => {
    expect(archiveFormatOf(bytes([0x7b, 0x22]))).toBe('');
  });
});

describe('helpers', () => {
  it('strips archive extensions', () => {
    expect(stripArchiveExtension('My Server.tar.gz')).toBe('My Server');
    expect(stripArchiveExtension('pack.zip')).toBe('pack');
  });

  it('reads the code of a task error', () => {
    expect(taskErrorCode('NOT_ENOUGH_SPACE: 3 GB needed')).toBe('NOT_ENOUGH_SPACE');
    expect(taskErrorCode('something broke')).toBe('');
  });
});

describe('createUploadMeter', () => {
  it('waits before it tells the time left, then averages the speed', () => {
    const meter = createUploadMeter(10_000, 0);

    expect(meter.update(1_000, null, 1_000).secondsLeft).toBeNull();

    const stats = meter.update(4_000, null, 4_000);

    expect(stats.speed).toBe(1_000);
    expect(stats.secondsLeft).toBe(6);
    expect(stats.percent).toBe(40);
  });

  it('reports in file bytes when the browser counts the multipart framing', () => {
    const meter = createUploadMeter(1_000, 0);
    const stats = meter.update(550, 1_100, 3_000);

    expect(stats.loaded).toBe(500);
    expect(stats.total).toBe(1_000);
  });

  it('is sent once every byte went out', () => {
    const meter = createUploadMeter(1_000, 0);

    expect(meter.update(1_000, null, 3_000).sent).toBe(true);
  });
});
