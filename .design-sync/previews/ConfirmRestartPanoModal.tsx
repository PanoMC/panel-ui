import * as React from 'react';
import { ConfirmRestartPanoModal } from '@panomc/panel-ui';

// WebsiteSettings.svelte renders <ConfirmRestartPanoModal runMode={data.runMode} /> and
// opens it via the module-level show().
const Opened = ({ runMode }: { runMode: Record<string, unknown> }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRestartPanoModal as any).show();
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmRestartPanoModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmRestartPanoModal previewOpen runMode={runMode} />;
};

// Platform already runs detached (-bg): plain restart confirm with password field.
export const Confirm = () => <Opened runMode={{ background: true }} />;

// Platform launched from a terminal: warning alert + required "restart in background" switch.
export const TerminalModeWarning = () => <Opened runMode={{ background: false }} />;
