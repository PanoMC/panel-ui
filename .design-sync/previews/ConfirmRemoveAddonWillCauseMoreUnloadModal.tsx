import * as React from 'react';
import { ConfirmRemoveAddonWillCauseMoreUnloadModal } from '@panomc/panel-ui';

// Opened imperatively from AddonDetailLayout: show(plugin) with { id, removeDependents[] }.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemoveAddonWillCauseMoreUnloadModal as any).show({
        id: 'pano-economy',
        removeDependents: ['pano-shop', 'pano-auction-house', 'pano-vote-rewards'],
      });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmRemoveAddonWillCauseMoreUnloadModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmRemoveAddonWillCauseMoreUnloadModal previewOpen />;
};

export const RemoveWithDependents = () => <Opened />;
