import * as React from 'react';
import { PageNav, PageNavItem } from '@panomc/panel-ui';

// Active pill, as in SettingsLayout when the route matches
export const Active = () => (
  <PageNav>
    <PageNavItem href="/tickets" active><>All Tickets</></PageNavItem>
  </PageNav>
);

// Default (inactive) link pill
export const Inactive = () => (
  <PageNav>
    <PageNavItem href="/tickets/categories" active={false}><>Ticket Categories</></PageNavItem>
  </PageNav>
);

// Disabled pill (e.g. a section the plugin has not unlocked yet)
export const Disabled = () => (
  <PageNav>
    <PageNavItem href="/migration/other" active={false} disabled><>Other Platforms</></PageNavItem>
  </PageNav>
);

// Button mode: acts as a click handler instead of a link
export const ButtonMode = () => (
  <PageNav>
    <PageNavItem button active={false} onclick={() => {}}>
      <>Refresh Statistics</>
    </PageNavItem>
  </PageNav>
);
