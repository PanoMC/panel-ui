import * as React from 'react';
import { ConfirmStopThemeModal } from '@panomc/panel-ui';

// Opened from theme management to stop the running theme: show(continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmStopThemeModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmStopThemeModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmStopThemeModal previewOpen />;
};

export const Confirm = () => <Opened />;
