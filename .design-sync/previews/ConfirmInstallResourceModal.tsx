import * as React from 'react';
import { ConfirmInstallResourceModal } from '@panomc/panel-ui';

// Opened imperatively from StoreLoading: show(versionInfo, resourceType).
// versionInfo mirrors the store token response: { action, version: {...}, installed? }.
const makeVersion = (over: any = {}) => ({
  resourceId: 'pano-discord-bridge',
  resourceTitle: 'Discord Bridge',
  tag: 'v2.4.1',
  type: 'ADDON',
  verified: true,
  author: 'PanoTeam',
  size: 4718592,
  changelog: '- Added slash command sync\n- Fixed webhook rate limiting',
  hash: '9f2c1a7e5b3d8c640fa1e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
  screenshots: [],
  ...over,
});

const Opened = ({ versionInfo, type = 'ADDON' }: { versionInfo: any; type?: string }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmInstallResourceModal as any).show(versionInfo, type);
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmInstallResourceModal as any).hide();
      } catch {}
    };
  }, []);
  return (
    <>
      {/* The component nests a <ChangelogModal /> (opened on demand from the
          changelog icon); previewOpen force-shows every .modal in the card,
          so hide the empty nested one — only the confirm dialog is the story. */}
      <style>{`[data-pano-component="ConfirmInstallResourceModal"] .modal ~ .modal { display: none !important; }`}</style>
      <ConfirmInstallResourceModal previewOpen />
    </>
  );
};

export const InstallAddon = () => (
  <Opened versionInfo={{ action: 'INSTALL', version: makeVersion() }} />
);

export const UpdateAddon = () => (
  <Opened
    versionInfo={{
      action: 'UPDATE',
      version: makeVersion({ tag: 'v2.5.0' }),
      installed: { version: 'v2.4.1' },
    }}
  />
);

export const DowngradeWarning = () => (
  <Opened
    versionInfo={{
      action: 'DOWNGRADE',
      version: makeVersion({ tag: 'v2.3.0' }),
      installed: { version: 'v2.4.1' },
    }}
  />
);

export const UnverifiedTheme = () => (
  <Opened
    type="THEME"
    versionInfo={{
      action: 'INSTALL',
      version: makeVersion({
        resourceId: 'nether-dark-theme',
        resourceTitle: 'Nether Dark Theme',
        tag: 'v1.0.3',
        type: 'THEME',
        verified: false,
        author: 'CraftStudioX',
        size: 12582912,
      }),
    }}
  />
);
