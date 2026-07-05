import * as React from 'react';
import { AuthorizePlayerModal } from '@panomc/panel-ui';

// show(player) GETs /api/panel/permissionGroups on open (ApiUtil → window.fetch).
// Serve that endpoint from the preview in the backend's shape
// ({ result, permissionGroups: [{ name }] }) so the real fetch → store pipeline
// renders the loaded authorize form instead of the spinner.
const demoGroups = ['admin', 'moderator', 'helper', 'vip'].map((name) => ({ name }));

let patched = false;
function patchFetch() {
  if (patched) return;
  patched = true;
  const orig = window.fetch.bind(window);
  window.fetch = ((input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.includes('permissionGroups')) {
      return Promise.resolve(
        new Response(JSON.stringify({ result: 'ok', permissionGroups: demoGroups }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
    return orig(input, init);
  }) as typeof window.fetch;
}

const Opened = () => {
  patchFetch();
  React.useEffect(() => {
    const t = setTimeout(() => {
      (AuthorizePlayerModal as any).show({ username: 'Herobrine', permissionGroup: 'moderator' });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (AuthorizePlayerModal as any).hide?.();
      } catch {}
    };
  }, []);
  return <AuthorizePlayerModal previewOpen />;
};

export const GroupsLoaded = () => <Opened />;
