import * as React from 'react';
import { ConfirmRemovePermTrackModal } from '@panomc/panel-ui';

// Opened imperatively from Permissions page: show(track).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemovePermTrackModal as any).show({ id: 2, name: 'Staff Ladder' });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmRemovePermTrackModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmRemovePermTrackModal previewOpen />;
};

export const ConfirmRemoveTrack = () => <Opened />;
