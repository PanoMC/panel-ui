import * as React from 'react';
import { CardFilters, CardFiltersItem } from '@panomc/panel-ui';

// Active filter pill (current selection highlighted)
export const Active = () => (
  <CardFilters>
    <CardFiltersItem href="/players" active><>All Players</></CardFiltersItem>
  </CardFilters>
);

// Inactive filter pill (outline style)
export const Inactive = () => (
  <CardFilters>
    <CardFiltersItem href="/players/banned"><>Banned</></CardFiltersItem>
  </CardFilters>
);

// Button mode with a click handler instead of navigation
export const ButtonMode = () => (
  <CardFilters>
    <CardFiltersItem button onclick={() => {}}>
      <>Awaiting Reply</>
    </CardFiltersItem>
  </CardFilters>
);
