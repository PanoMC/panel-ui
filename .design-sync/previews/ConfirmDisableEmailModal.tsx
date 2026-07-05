import * as React from 'react';
import { ConfirmDisableEmailModal } from '@panomc/panel-ui';

// Opened imperatively from PlatformSettings: show(continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDisableEmailModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmDisableEmailModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmDisableEmailModal previewOpen />;
};

export const ConfirmDisableEmail = () => <Opened />;
