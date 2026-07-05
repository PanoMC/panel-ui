import * as React from 'react';
import { ConfirmRemovePermUserModal } from '@panomc/panel-ui';

// Opened imperatively from Permissions page: show(user).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemovePermUserModal as any).show({ id: 7, username: 'Herobrine' });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmRemovePermUserModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmRemovePermUserModal previewOpen />;
};

export const ConfirmRemoveUser = () => <Opened />;
