import * as React from 'react';
import { ConfirmUpdateResourceModal } from '@panomc/panel-ui';

// Opened from an addon/theme detail page's update button: show(continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmUpdateResourceModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmUpdateResourceModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmUpdateResourceModal previewOpen />;
};

export const Confirm = () => <Opened />;
