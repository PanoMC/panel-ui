import * as React from 'react';
import { Date as PanoDate } from '@panomc/panel-ui';

// Fixed reference: a post published a while back, plus a recent activity time
const publishedAt = new globalThis.Date('2026-06-12T14:30:00').getTime();
const twoHoursAgo = globalThis.Date.now() - 2 * 60 * 60 * 1000;

export const Default = () => <PanoDate time={publishedAt} />;

export const Relative = () => <PanoDate time={twoHoursAgo} relativeFormat />;

export const FullTimestamp = () => <PanoDate time={publishedAt} fullFormat />;

export const IsoString = () => <PanoDate time="2026-01-03T09:15:00" />;
