import * as React from 'react';
import { WebsiteActivityChart } from '@panomc/panel-ui';

// Static capture: the sheet screenshots before chart.js animations finish, so
// skew Date.now() forward on every call — the bundled chart.js Animator sees
// elapsed >= duration on its first tick and draws the final frame immediately.
const __realNow = Date.now.bind(Date);
let __skew = 0;
Date.now = () => __realNow() + (__skew += 5000);

// The component clamps its time axis to [now - period, now], so data must be
// generated relative to Date.now() — same shape as websiteActivityDataList.
const DAY = 24 * 60 * 60 * 1000;

function daily(days: number, values: (i: number) => number): Record<number, number> {
  const out: Record<number, number> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    out[now - i * DAY] = values(days - 1 - i);
  }
  return out;
}

const weekRegisters = daily(8, (i) => [3, 5, 2, 7, 4, 6, 9, 5][i % 8]);
const weekVisitors = daily(8, (i) => [42, 55, 38, 61, 48, 72, 84, 66][i % 8]);
const weekViews = daily(8, (i) => [120, 160, 105, 190, 150, 220, 260, 205][i % 8]);
const weekTickets = daily(8, (i) => [1, 2, 0, 3, 1, 2, 4, 2][i % 8]);

const monthRegisters = daily(31, (i) => 2 + Math.round(4 * Math.abs(Math.sin(i / 4))));
const monthVisitors = daily(31, (i) => 35 + Math.round(40 * Math.abs(Math.sin(i / 5))));
const monthViews = daily(31, (i) => 90 + Math.round(140 * Math.abs(Math.sin(i / 6))));
const monthTickets = daily(31, (i) => Math.round(2 * Math.abs(Math.sin(i / 3))));

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">
    <div className="card-body">{children}</div>
  </div>
);

export const WeeklyActivity = () => (
  <Card>
    <WebsiteActivityChart
      newRegisterData={weekRegisters}
      visitorData={weekVisitors}
      viewData={weekViews}
      ticketsData={weekTickets}
      period="WEEK"
    />
  </Card>
);

export const MonthlyActivity = () => (
  <Card>
    <WebsiteActivityChart
      newRegisterData={monthRegisters}
      visitorData={monthVisitors}
      viewData={monthViews}
      ticketsData={monthTickets}
      period="MONTH"
    />
  </Card>
);
