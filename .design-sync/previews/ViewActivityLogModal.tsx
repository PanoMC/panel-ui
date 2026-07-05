import * as React from 'react';
import { ViewActivityLogModal } from '@panomc/panel-ui';

const M = ViewActivityLogModal as any;

// Real call site (ActivityLogs.svelte): showViewActivityLogModal(log) with the
// clicked row; the modal pretty-prints log.details as read-only JSON.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show({
        id: 412,
        type: 'PLAYER_BANNED',
        username: 'Herobrine',
        createdAt: 1751587200000,
        details: {
          player: 'GrieferKid99',
          reason: 'X-ray and fly hacks on CraftRealms Survival',
          bannedBy: 'Herobrine',
          server: 'CraftRealms Survival',
          ip: '203.0.113.42',
          expiresAt: '2026-08-01T00:00:00Z',
          banIp: true,
        },
      });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <ViewActivityLogModal previewOpen />;
};

export const Details = () => <Opened />;
