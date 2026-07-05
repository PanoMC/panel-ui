import * as React from 'react';
import { SearchInput } from '@panomc/panel-ui';

// Default empty search box (placeholder "Find...")
export const Default = () => (
  <div style={{ maxWidth: 260 }}>
    <SearchInput onchange={() => {}} />
  </div>
);

// Actively searching: inline spinner shown next to the input
export const Searching = () => (
  <div style={{ maxWidth: 260 }}>
    <SearchInput initialValue="Herobrine" searching onchange={() => {}} />
  </div>
);

// Pre-filled value (e.g. filter carried over from the URL), spinner idle
export const WithValue = () => (
  <div style={{ maxWidth: 260 }}>
    <SearchInput initialValue="CraftRealms" onchange={() => {}} />
  </div>
);
