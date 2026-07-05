import * as React from 'react';
import { ConfirmDraftPostModal } from '@panomc/panel-ui';

// Opened imperatively from PostsLayout: show(continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDraftPostModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmDraftPostModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmDraftPostModal previewOpen />;
};

export const ConfirmMoveToDraft = () => <Opened />;
