import * as React from 'react';
import { AddonLicenseCard } from '@panomc/panel-ui';
// KNOWN GAP (config-level): the component bundle is built without
// VITE_PANO_WEBSITE_URL, so websiteDisplayHost() returns '' and every
// {website} i18n placeholder renders empty ("Buy a license on to enable it").
// Not fixable from the preview — the bundle inlines its own variables.js copy.

// Mirrors data.addon in src/lib/pages/addons/AddonDetail.svelte.
const baseAddon = {
  id: 'discord-webhooks',
  name: 'Discord Webhooks',
  premium: true,
  purchaseUrl: 'https://panomc.com/addons/discord-webhooks',
};

const Cell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 480 }}>{children}</div>
);

export const Licensed = () => (
  <Cell>
    <AddonLicenseCard addon={{ ...baseAddon, licenseStatus: 'LICENSED' }} />
  </Cell>
);

export const NoPurchase = () => (
  <Cell>
    <AddonLicenseCard addon={{ ...baseAddon, licenseStatus: 'NO_PURCHASE' }} />
  </Cell>
);

export const NotConnected = () => (
  <Cell>
    <AddonLicenseCard addon={{ ...baseAddon, licenseStatus: 'NOT_CONNECTED' }} />
  </Cell>
);

export const Expired = () => (
  <Cell>
    <AddonLicenseCard addon={{ ...baseAddon, licenseStatus: 'EXPIRED' }} />
  </Cell>
);

export const NetworkError = () => (
  <Cell>
    <AddonLicenseCard addon={{ ...baseAddon, licenseStatus: 'NETWORK_ERROR' }} />
  </Cell>
);
