import * as React from 'react';
import { ConfirmDeletePlayerModal } from '@panomc/panel-ui';

// Opened from the player detail page: ConfirmDeletePlayerModal.show(player).
// The admin must re-enter their own password before the account is deleted.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDeletePlayerModal as any).show({ username: 'Notch' });
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmDeletePlayerModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmDeletePlayerModal previewOpen />;
};

export const DeletePlayerAccount = () => <Opened />;
