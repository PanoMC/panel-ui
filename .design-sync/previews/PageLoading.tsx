import * as React from 'react';
import { PageLoading } from '@panomc/panel-ui';

// The spinner fills h-75 of its parent, so give it a page-like area.
export const Loading = () => (
  <div style={{ height: 220 }}>
    <PageLoading show={true} />
  </div>
);
