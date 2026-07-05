import * as React from 'react';
import { RestartingModal, panoStores } from '@panomc/panel-ui';

// The modal is gated on the platformRestarting context store (writable(false)
// in the demo context) — flip it on, exactly like the platform does when a
// restart is triggered from Settings.
const Restarting = () => {
  React.useEffect(() => {
    (panoStores as any).platformRestarting.set(true);
    return () => {
      try {
        (panoStores as any).platformRestarting.set(false);
      } catch {}
    };
  }, []);
  return <RestartingModal previewOpen />;
};

export const PlatformRestarting = () => <Restarting />;
