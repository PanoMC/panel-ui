import * as React from 'react';
import { Bottom } from '@panomc/panel-ui';

// Sidebar footer links on the real sidebar background (bg-primary, 240px wide)
export const SidebarFooter = () => (
  <div className="bg-primary rounded p-2" style={{ width: 240 }}>
    <Bottom />
  </div>
);

// Same footer at mobile offcanvas width
export const OffcanvasFooter = () => (
  <div className="bg-primary rounded p-2" style={{ width: 320 }}>
    <Bottom />
  </div>
);
