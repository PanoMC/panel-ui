import * as React from 'react';
import { ThemeLicenseCard } from '@panomc/panel-ui';
// KNOWN GAP (config-level): the component bundle is built without
// VITE_PANO_WEBSITE_URL, so websiteDisplayHost() returns '' and the
// {website} i18n placeholder in the NoPurchase copy renders empty.
// Not fixable from the preview — the bundle inlines its own variables.js copy.

// Mirrors the theme object from src/lib/pages/view/ThemeDetail.svelte.
const baseTheme = {
  id: 'blaze-theme',
  name: 'Blaze Theme',
  premium: true,
};

const Cell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 480 }}>{children}</div>
);

export const Licensed = () => (
  <Cell>
    <ThemeLicenseCard theme={{ ...baseTheme, licenseStatus: 'LICENSED' }} />
  </Cell>
);

export const NoPurchase = () => (
  <Cell>
    <ThemeLicenseCard theme={{ ...baseTheme, licenseStatus: 'NO_PURCHASE' }} />
  </Cell>
);

export const NotConnected = () => (
  <Cell>
    <ThemeLicenseCard theme={{ ...baseTheme, licenseStatus: 'NOT_CONNECTED' }} />
  </Cell>
);

export const Expired = () => (
  <Cell>
    <ThemeLicenseCard theme={{ ...baseTheme, licenseStatus: 'EXPIRED' }} />
  </Cell>
);
