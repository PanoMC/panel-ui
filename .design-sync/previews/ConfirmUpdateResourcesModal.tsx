import * as React from 'react';
import { ConfirmUpdateResourcesModal } from '@panomc/panel-ui';

// Opened by the "update all" button on the Updates page: show(continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmUpdateResourcesModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmUpdateResourcesModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmUpdateResourcesModal previewOpen />;
};

export const Confirm = () => <Opened />;
