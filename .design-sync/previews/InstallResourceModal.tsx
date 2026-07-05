import * as React from 'react';
import { InstallResourceModal } from '@panomc/panel-ui';

const M = InstallResourceModal as any;

// Real call site (Addons.svelte): showInstallResourceModal('PLUGIN').
// Two-pane chooser: drag-and-drop a .jar beside the "install from Pano store" tile.
// Module-level singleton stores mean only one state per page — PLUGIN is canonical.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show('PLUGIN');
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <InstallResourceModal previewOpen />;
};

export const InstallAddon = () => <Opened />;
