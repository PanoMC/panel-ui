import * as React from 'react';
import { UnbanPlayerModal } from '@panomc/panel-ui';

const M = UnbanPlayerModal as any;

// Real call site (Players.svelte / PlayerDetailLayout): show(player) with the
// banned player's row object; confirm fires DELETE only on "Yes".
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show({ id: 8, username: 'GrieferKid99', isBanned: true });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <UnbanPlayerModal previewOpen />;
};

export const Confirm = () => <Opened />;
