import * as React from 'react';
import { ConfirmRemovePanoAccountModal } from '@panomc/panel-ui';

// Opened imperatively from PlatformSettings: show(continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemovePanoAccountModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmRemovePanoAccountModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmRemovePanoAccountModal previewOpen />;
};

export const ConfirmDisconnectAccount = () => <Opened />;
