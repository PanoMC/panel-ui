import * as React from 'react';
import { App } from '@panomc/panel-ui';

// App is the invisible root shell every panel route renders inside: it adds
// the top navigation PageLoader progress bar and passes the page through its
// default slot. The story shows real page content flowing through the shell.

export const Shell = () => (
  <App>
    <div className="card">
      <div className="card-body">
        <h5 className="fw-bold mb-1">CraftRealms Survival</h5>
        <p className="text-body-secondary mb-3">SPIGOT 1.21.4 — 42/100 players online</p>
        <div className="d-flex gap-2">
          <span className="badge text-bg-success">Server online</span>
          <span className="badge text-bg-secondary">3 notifications</span>
        </div>
      </div>
    </div>
  </App>
);
