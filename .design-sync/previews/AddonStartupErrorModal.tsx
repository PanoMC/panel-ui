import * as React from 'react';
import { AddonStartupErrorModal } from '@panomc/panel-ui';

const SAMPLE_LOG = `[14:23:11] ERROR PluginManager - Failed to start "pano-discord-bridge" v1.4.2
org.pf4j.PluginRuntimeException: Cannot connect to Discord gateway
    at DiscordBridgePlugin.start(DiscordBridgePlugin.kt:87)
Caused by: LoginException: The provided token is invalid!
    ... 12 more
[14:23:11] WARN  Plugin "pano-discord-bridge" disabled after startup failure`;

// Opened imperatively by the Addons page: AddonStartupErrorModal.show(errorLog).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (AddonStartupErrorModal as any).show(SAMPLE_LOG);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (AddonStartupErrorModal as any).hide?.(); } catch {}
    };
  }, []);
  return <AddonStartupErrorModal previewOpen />;
};

export const StartupErrorLog = () => <Opened />;
