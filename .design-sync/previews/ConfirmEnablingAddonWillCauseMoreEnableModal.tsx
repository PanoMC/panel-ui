import * as React from 'react';
import { ConfirmEnablingAddonWillCauseMoreEnableModal } from '@panomc/panel-ui';

// Opened imperatively from AddonsLayout: show(plugin) with { id, notStartedDependencies[] }.
const Opened = ({ plugin }: { plugin: any }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmEnablingAddonWillCauseMoreEnableModal as any).show(plugin);
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmEnablingAddonWillCauseMoreEnableModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmEnablingAddonWillCauseMoreEnableModal previewOpen />;
};

export const EnableWithDependencies = () => (
  <Opened
    plugin={{ id: 'pano-shop', notStartedDependencies: ['pano-economy', 'pano-core-api'] }}
  />
);
