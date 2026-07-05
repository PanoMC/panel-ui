import * as React from 'react';
import { ConfirmSaveCriticalSettingsModal } from '@panomc/panel-ui';

// Opened when saving critical platform settings: show(callback) — password re-entry required.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmSaveCriticalSettingsModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmSaveCriticalSettingsModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmSaveCriticalSettingsModal previewOpen />;
};

export const Confirm = () => <Opened />;
