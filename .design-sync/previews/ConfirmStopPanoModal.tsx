import * as React from 'react';
import { ConfirmStopPanoModal } from '@panomc/panel-ui';

// Opened from platform settings: show() takes no args; asks for the account password.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmStopPanoModal as any).show();
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmStopPanoModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmStopPanoModal previewOpen />;
};

export const Confirm = () => <Opened />;
