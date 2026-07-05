import * as React from 'react';
import { RemoveServerModal } from '@panomc/panel-ui';

const M = RemoveServerModal as any;

// Real call site (ServerSettings.svelte): showRemoveServerModal($selectedServer).
// Destructive action: question icon + account-password input + cancel/yes(danger).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show({
        id: 3,
        name: 'CraftRealms Survival',
        type: 'SPIGOT',
        version: '1.21.4',
      });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <RemoveServerModal previewOpen />;
};

export const Confirm = () => <Opened />;
