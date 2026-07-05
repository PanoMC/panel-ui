import * as React from 'react';
import { CardFilters, CardFiltersItem } from '@panomc/panel-ui';

// Ticket status filters, as on the Tickets page card header
export const TicketFilters = () => (
  <CardFilters>
    <CardFiltersItem href="/tickets" active><>All</></CardFiltersItem>
    <CardFiltersItem href="/tickets/waiting-reply"><>Awaiting Reply</></CardFiltersItem>
    <CardFiltersItem href="/tickets/closed"><>Closed</></CardFiltersItem>
  </CardFilters>
);

// Player list filters (button mode), as on the Players page
export const PlayerFilters = () => (
  <CardFilters>
    <CardFiltersItem button active onclick={() => {}}>
      <>All Players</>
    </CardFiltersItem>
    <CardFiltersItem button onclick={() => {}}>
      <>Online</>
    </CardFiltersItem>
    <CardFiltersItem button onclick={() => {}}>
      <>Banned</>
    </CardFiltersItem>
  </CardFilters>
);

// Many filters in a narrow card: group scrolls horizontally
export const ScrollingFilters = () => (
  <div style={{ maxWidth: 320 }}>
    <CardFilters>
      <CardFiltersItem href="/addons" active><>All</></CardFiltersItem>
      <CardFiltersItem href="/addons/plugins"><>Plugins</></CardFiltersItem>
      <CardFiltersItem href="/addons/themes"><>Themes</></CardFiltersItem>
      <CardFiltersItem href="/addons/updates"><>Updates</></CardFiltersItem>
      <CardFiltersItem href="/addons/disabled"><>Disabled</></CardFiltersItem>
    </CardFilters>
  </div>
);
