import * as React from 'react';
import { ConfirmPublishPostModal } from '@panomc/panel-ui';

// Opened imperatively from PostsLayout: show(continueProcess).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmPublishPostModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmPublishPostModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmPublishPostModal previewOpen />;
};

export const ConfirmPublish = () => <Opened />;
