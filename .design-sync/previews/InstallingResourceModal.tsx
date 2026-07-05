import * as React from 'react';
import { InstallingResourceModal } from '@panomc/panel-ui';

const M = InstallingResourceModal as any;

// Real flow starts with show(type, file|versionId, ...) which uploads/opens SSE
// streams. Calling show('PLUGIN') with no file/versionId renders the honest
// "installing" first step (striped animated bar, step text) without any network.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show('PLUGIN');
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide({ force: true });
      } catch {}
    };
  }, []);
  return <InstallingResourceModal previewOpen />;
};

export const Installing = () => <Opened />;
