import * as React from 'react';
import { ConnectServerModal, panoStores } from '@panomc/panel-ui';

// The navbar opens this via data-bs-toggle / show(); it reads its state from svelte context:
// session.basicData.acceptPluginAuth, platformServerMatchKey, platformKeyRefreshedTime,
// platformHostAddress. The demo context provides the platform keys; acceptPluginAuth is
// flipped here so the canonical story shows the enabled setup flow.
const stores = panoStores as any;

// Keep the 30s refresh countdown meaningful instead of long-expired.
stores.platformKeyRefreshedTime.set(Date.now());

const setPluginAuth = (enabled: boolean) => {
  stores.session.update((s: any) => ({
    ...s,
    basicData: { ...s.basicData, acceptPluginAuth: enabled },
  }));
};

const Opened = ({ enabled }: { enabled: boolean }) => {
  // Set synchronously during render — the bridge mounts the Svelte component in an
  // effect, which runs after this, so the component reads the right session value.
  setPluginAuth(enabled);
  return <ConnectServerModal previewOpen />;
};

// Plugin auth enabled: 3-step setup with local/remote tabs and the /pano connect command.
export const SetupSteps = () => <Opened enabled={true} />;

// Plugin auth toggled off: body dimmed, command and copy buttons disabled.
export const AuthDisabled = () => <Opened enabled={false} />;
