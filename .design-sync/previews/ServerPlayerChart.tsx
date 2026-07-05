import * as React from 'react';
import { ServerPlayerChart } from '@panomc/panel-ui';

// Static capture: the sheet screenshots before chart.js animations finish, so
// skew Date.now() forward on every call — the bundled chart.js Animator sees
// elapsed >= duration on its first tick and draws the final frame immediately.
const __realNow = Date.now.bind(Date);
let __skew = 0;
Date.now = () => __realNow() + (__skew += 5000);

// Rendered like ServerDashboard: inside a card body with a padded wrapper.
const Card = ({ label, right, children }: { label: string; right: string; children: React.ReactNode }) => (
  <div className="card" style={{ maxWidth: 260 }}>
    <div className="card-header d-flex justify-content-between align-items-center">
      <span>{label}</span>
      <span className="text-body-secondary small">{right}</span>
    </div>
    <div className="card-body d-flex flex-column align-items-center justify-content-center overflow-hidden">
      <div className="w-100 p-2">{children}</div>
    </div>
  </div>
);

export const HalfFull = () => (
  <Card label="Players" right="42 / 100">
    <ServerPlayerChart playerCount={42} maxPlayerCount={100} />
  </Card>
);

export const NearlyFull = () => (
  <Card label="Players" right="230 / 250">
    <ServerPlayerChart playerCount={230} maxPlayerCount={250} />
  </Card>
);

export const EmptyServer = () => (
  <Card label="Players" right="0 / 60">
    <ServerPlayerChart playerCount={0} maxPlayerCount={60} />
  </Card>
);
