import * as React from 'react';
import { SummaryStatCard } from '@panomc/panel-ui';

// Static capture: the sheet screenshots before chart.js animations finish, so
// skew Date.now() forward on every call — the bundled chart.js Animator sees
// elapsed >= duration on its first tick and draws the final frame immediately.
const __realNow = Date.now.bind(Date);
let __skew = 0;
Date.now = () => __realNow() + (__skew += 5000);

// Hourly sparkline data keyed by ms timestamp, like websiteActivityDataList entries.
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

function series(values: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  values.forEach((v, i) => {
    out[now - (values.length - 1 - i) * (DAY / 4)] = v;
  });
  return out;
}

const onlineData = series([18, 24, 21, 30, 27, 35, 33, 41, 38, 45, 42, 48]);
const registerData = series([12, 9, 14, 8, 11, 7, 10, 6, 9, 5, 8, 6]);
const totalData = series([1240, 1252, 1263, 1271, 1284, 1290, 1301, 1312, 1320, 1333, 1341, 1352]);

const Cell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 360 }}>{children}</div>
);

export const OnlinePlayersUp = () => (
  <Cell>
    <SummaryStatCard
      title="Online Players"
      value={48}
      previousValue={35}
      data={onlineData}
      secondaryValue="last 7 days"
      color="#ffffff"
      colorClass="text-bg-success"
    />
  </Cell>
);

export const NewRegistersDown = () => (
  <Cell>
    <SummaryStatCard
      title="New Registrations"
      value={6}
      previousValue={12}
      data={registerData}
      secondaryValue="last 7 days"
      color="#ffffff"
      colorClass="text-bg-info"
    />
  </Cell>
);

export const TotalPlayersNeutral = () => (
  <Cell>
    <SummaryStatCard
      title="Total Players"
      value={1352}
      previousValue={1352}
      data={totalData}
      secondaryValue="last 30 days"
      color="#ffffff"
      colorClass="text-bg-primary"
    />
  </Cell>
);

export const PlainNoComparison = () => (
  <Cell>
    <SummaryStatCard
      title="Tickets Opened"
      value={23}
      data={series([2, 4, 3, 6, 5, 4, 7, 6, 8, 5, 9, 7])}
      secondaryValue="this week"
      hasComparison={false}
    />
  </Cell>
);
