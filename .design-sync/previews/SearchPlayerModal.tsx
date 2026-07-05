import * as React from 'react';
import { SearchPlayerModal } from '@panomc/panel-ui';

// Opened imperatively (Permissions.svelte): showSearchPlayerModal({ localPlayers,
// allGroups, nodes, existingUserIds }). The results list is fed by localPlayers,
// mirroring the Permissions page's "add user to permission group" flow.

const localPlayers = [
  { id: 1, username: 'Herobrine' },
  { id: 2, username: 'HeroOfTheVillage' },
  { id: 3, username: 'Ender_Hero' },
];
const allGroups = [
  { name: 'admin', displayName: 'Admin' },
  { name: 'moderator', displayName: 'Moderator' },
  { name: 'default', displayName: 'Default' },
];
const nodes = [
  { holderType: 'USER', holderId: 1, node: 'group.admin', active: true },
  { holderType: 'USER', holderId: 2, node: 'group.moderator', active: true },
];

// Preview-only pixel-art avatar (the real modal loads /api/profile/picture/<name>,
// which has no backend in the static preview).
const avatarUri = (skin: string, hair: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">` +
      `<rect width="8" height="8" fill="${skin}"/>` +
      `<rect width="8" height="3" fill="${hair}"/>` +
      `<rect x="1" y="4" width="1" height="1" fill="#fff"/><rect x="2" y="4" width="1" height="1" fill="#3b2d8f"/>` +
      `<rect x="5" y="4" width="1" height="1" fill="#fff"/><rect x="6" y="4" width="1" height="1" fill="#3b2d8f"/>` +
      `<rect x="3" y="6" width="2" height="1" fill="#8a5a3a"/>` +
      `</svg>`,
  );
const avatars: Record<string, string> = {
  Herobrine: avatarUri('#b98a63', '#3a2c1e'),
  HeroOfTheVillage: avatarUri('#c99a70', '#6b4a2b'),
  Ender_Hero: avatarUri('#a97a55', '#151515'),
};

const useSearchDemo = (typeQuery: string | null) => {
  React.useEffect(() => {
    const realFetch = window.fetch;
    // The modal always queries /api/panel/player/search after its debounce;
    // answer it statically so the preview shows only the local matches.
    (window as any).fetch = (input: any, init: any) => {
      const url = typeof input === 'string' ? input : String(input?.url ?? input ?? '');
      if (url.includes('player/search')) {
        return Promise.resolve(
          new Response(JSON.stringify({ players: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return realFetch(input, init);
    };

    const root = () => document.querySelector('[data-pano-component="SearchPlayerModal"]');

    const t1 = setTimeout(() => {
      (SearchPlayerModal as any).setCallback(() => {});
      (SearchPlayerModal as any).show({
        localPlayers,
        allGroups,
        nodes,
        existingUserIds: [1],
      });
    }, 40);

    const t2 = setTimeout(() => {
      if (typeQuery == null) return;
      const input = root()?.querySelector('input[type="text"]') as HTMLInputElement | null;
      if (input) {
        input.value = typeQuery;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 120);

    // Preview cosmetics: swap dead avatar URLs for data-URI heads; drop the
    // SEARCH_FAILED alert the offline API layer produces (results themselves
    // come from localPlayers and are real).
    const tidy = setInterval(() => {
      const el = root();
      if (!el) return;
      el.querySelectorAll('img').forEach((img) => {
        const name = img.getAttribute('alt') || '';
        if (!img.src.startsWith('data:') && avatars[name]) img.src = avatars[name];
      });
      el.querySelectorAll('.alert-danger').forEach((a) => a.remove());
    }, 120);
    const t3 = setTimeout(() => clearInterval(tidy), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(tidy);
      (window as any).fetch = realFetch;
      try {
        (SearchPlayerModal as any).hide();
      } catch {}
    };
  }, [typeQuery]);
};

const Demo = ({ query }: { query: string | null }) => {
  useSearchDemo(query);
  return <SearchPlayerModal previewOpen />;
};

export const StartTyping = () => <Demo query={null} />;

export const WithResults = () => <Demo query="hero" />;
