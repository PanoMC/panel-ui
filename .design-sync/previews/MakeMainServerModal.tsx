import * as React from 'react';
import { MakeMainServerModal } from '@panomc/panel-ui';

const M = MakeMainServerModal as any;

// Real call site (ServerSettings.svelte): showMakeMainServerModal($selectedServer).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show({
        id: 2,
        name: 'CraftRealms Skyblock',
        type: 'PAPER',
        version: '1.21.4',
        playerCount: 17,
        maxPlayerCount: 60,
      });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <MakeMainServerModal previewOpen />;
};

export const Confirm = () => <Opened />;
