import * as React from 'react';
import { ServerRequestModal } from '@panomc/panel-ui';

const M = ServerRequestModal as any;

// Real call site (AppLayout.svelte): showServerRequestModal(id) when a Minecraft
// server asks to connect. show(serverId) immediately fetches the server and starts
// in the spinner state; without a backend the designed loading state is what
// renders — captured as the loading story.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        M.show(7);
      } catch {}
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <ServerRequestModal previewOpen />;
};

export const Loading = () => <Opened />;
