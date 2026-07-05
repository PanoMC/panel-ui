import * as React from 'react';
import { ConfirmUpdatePlatformModal } from '@panomc/panel-ui';

// Updates.svelte renders <ConfirmUpdatePlatformModal runMode={data.runMode} /> and opens it
// via show(continueProcess).
const Opened = ({ runMode }: { runMode: Record<string, unknown> }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmUpdatePlatformModal as any).show(() => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmUpdatePlatformModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmUpdatePlatformModal previewOpen runMode={runMode} />;
};

// Platform already runs detached (-bg): simple update confirmation.
export const Confirm = () => <Opened runMode={{ background: true }} />;

// Platform attached to a terminal: warning alert + required "restart in background" switch.
export const TerminalModeWarning = () => <Opened runMode={{ background: false }} />;
