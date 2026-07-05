import * as React from 'react';
import { ConfirmResetPermissionsModal } from '@panomc/panel-ui';

// Opened from the Permissions page "reset to defaults" action: show() takes no args.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmResetPermissionsModal as any).show();
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmResetPermissionsModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmResetPermissionsModal previewOpen />;
};

export const Confirm = () => <Opened />;
