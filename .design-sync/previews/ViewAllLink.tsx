import * as React from 'react';
import { ViewAllLink } from '@panomc/panel-ui';

// Default arrow-only link, as used at the end of dashboard card headers
export const ArrowOnly = () => (
  <div className="d-flex align-items-center gap-2">
    <h6 className="m-0 fw-bold">Latest Tickets</h6>
    <ViewAllLink href="/tickets" />
  </div>
);

// Custom slot content instead of the arrow icon
export const WithLabel = () => (
  <ViewAllLink href="/players" classes="fw-semibold">
    <>
      View all players <i className="fa-solid fa-arrow-right ms-1"></i>
    </>
  </ViewAllLink>
);

// External target opens in a new tab
export const ExternalTarget = () => (
  <div className="d-flex align-items-center gap-2">
    <h6 className="m-0 fw-bold">CraftRealms Website</h6>
    <ViewAllLink href="https://craftrealms.example" targetBlank />
  </div>
);
