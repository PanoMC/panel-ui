import * as React from 'react';
import { ConfirmRemoveAllNotificationsModal } from '@panomc/panel-ui';

// Opened imperatively from Notifications page: show() takes no arguments.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemoveAllNotificationsModal as any).show();
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmRemoveAllNotificationsModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmRemoveAllNotificationsModal previewOpen />;
};

export const ConfirmClearAll = () => <Opened />;
