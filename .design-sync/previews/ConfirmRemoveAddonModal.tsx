import * as React from 'react';
import { ConfirmRemoveAddonModal } from '@panomc/panel-ui';

// Opened imperatively from AddonDetailLayout: show(pluginId, continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemoveAddonModal as any).show('pano-discord-bridge', () => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmRemoveAddonModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmRemoveAddonModal previewOpen />;
};

export const ConfirmRemoveAddon = () => <Opened />;
