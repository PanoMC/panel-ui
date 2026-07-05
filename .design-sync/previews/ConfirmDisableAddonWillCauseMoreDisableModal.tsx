import * as React from 'react';
import { ConfirmDisableAddonWillCauseMoreDisableModal } from '@panomc/panel-ui';

// Opened imperatively from AddonsLayout: show(plugin) with { id, dependents[] }.
const Opened = ({ plugin }: { plugin: any }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDisableAddonWillCauseMoreDisableModal as any).show(plugin);
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmDisableAddonWillCauseMoreDisableModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmDisableAddonWillCauseMoreDisableModal previewOpen />;
};

export const DisableWithDependents = () => (
  <Opened plugin={{ id: 'pano-economy', dependents: ['pano-shop', 'pano-auction-house'] }} />
);

export const DisableWithManyDependents = () => (
  <Opened
    plugin={{
      id: 'pano-core-api',
      dependents: ['pano-shop', 'pano-auction-house', 'pano-vote-rewards', 'pano-discord-bridge', 'pano-leaderboards'],
    }}
  />
);
