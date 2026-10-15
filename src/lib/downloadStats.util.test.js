import { describe, expect, test } from 'bun:test';

import { createDownloadTracker, trackDownload } from './downloadStats.util.js';

describe('download stats', () => {
  test('speed and time left come from the bytes over time', () => {
    const tracker = createDownloadTracker();

    expect(tracker.update(0, 10_000_000, 0)).toEqual({
      downloaded: 0,
      total: 10_000_000,
      speed: null,
      secondsLeft: null,
    });

    const stats = tracker.update(1_000_000, 10_000_000, 1000);

    expect(stats.speed).toBe(1_000_000);
    expect(stats.secondsLeft).toBe(9);
  });

  test('samples closer than a quarter second do not move the speed', () => {
    const tracker = createDownloadTracker();

    tracker.update(0, 100, 0);
    expect(tracker.update(50, 100, 100).speed).toBeNull();
  });

  test('an event without byte counts gives no stats', () => {
    expect(
      trackDownload(createDownloadTracker(), { status: 'progress', progress: 0.5 }),
    ).toBeNull();
  });

  test('an unknown total keeps the size and speed but no time left', () => {
    const tracker = createDownloadTracker();

    tracker.update(0, null, 0);
    const stats = tracker.update(500, null, 1000);

    expect(stats.total).toBeNull();
    expect(stats.secondsLeft).toBeNull();
    expect(stats.speed).toBe(500);
  });
});
