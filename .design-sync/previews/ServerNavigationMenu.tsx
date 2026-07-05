import * as React from 'react';
import { ServerNavigationMenu } from '@panomc/panel-ui';

// The menu reads $lib/PluginAPI.js serverNavigationItems, which is only seeded
// by PluginAPI.init() in the real app. The bridge does not call it, and the
// store is not reachable from previews — expected to render an empty list even
// though a server is selected (see learnings/navigation.md).
export const OnSidebar = () => (
  <div className="bg-primary rounded p-2" style={{ width: 240, minHeight: 200 }}>
    <ServerNavigationMenu />
  </div>
);
