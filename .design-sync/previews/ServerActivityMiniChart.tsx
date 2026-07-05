import * as React from 'react';
import { ServerActivityMiniChart } from '@panomc/panel-ui';

// Static capture: the sheet screenshots before chart.js animations finish, so
// skew Date.now() forward on every call — the bundled chart.js Animator sees
// elapsed >= duration on its first tick and draws the final frame immediately.
const __realNow = Date.now.bind(Date);
let __skew = 0;
Date.now = () => __realNow() + (__skew += 5000);

// The mini chart is position:absolute pinned to its parent's bottom, so it needs
// a relatively-positioned card of fixed height — same as the ServerDashboard
// "Server Status" card it lives in.
const MIN = 60 * 1000;

function activity(values: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  const now = Date.now();
  values.forEach((v, i) => {
    out[now - (values.length - 1 - i) * 10 * MIN] = v;
  });
  return out;
}

const busyEvening = activity([18, 22, 25, 31, 28, 36, 42, 39, 45, 48, 44, 42]);
const quietNight = activity([9, 7, 6, 5, 6, 4, 3, 4, 3, 2, 3, 2]);

const StatusCard = ({
  status,
  children,
}: {
  status: string;
  children: React.ReactNode;
}) => (
  <div className="card position-relative" style={{ maxWidth: 300, height: 180 }}>
    <div className="card-header d-flex justify-content-between align-items-center">
      <span>Server Status</span>
      <span className="text-success small fw-semibold">{status}</span>
    </div>
    <div className="card-body p-0 d-flex align-items-center justify-content-center overflow-hidden">
      {children}
    </div>
  </div>
);

export const BusyEvening = () => (
  <StatusCard status="Online">
    <ServerActivityMiniChart activityData={busyEvening} />
  </StatusCard>
);

export const QuietNight = () => (
  <StatusCard status="Online">
    <ServerActivityMiniChart activityData={quietNight} />
  </StatusCard>
);
