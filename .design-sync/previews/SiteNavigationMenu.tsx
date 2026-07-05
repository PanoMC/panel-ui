import * as React from 'react';
import { SiteNavigationMenu } from '@panomc/panel-ui';

// The menu reads $lib/PluginAPI.js siteNavigationItems, which is only seeded
// by PluginAPI.init() in the real app. The bridge does not call it, and the
// store is not reachable from previews — expected to render empty until the
// bridge seeds it (see learnings/navigation.md).
export const OnSidebar = () => (
  <div className="bg-primary rounded p-2" style={{ width: 240, minHeight: 200 }}>
    <SiteNavigationMenu />
  </div>
);
