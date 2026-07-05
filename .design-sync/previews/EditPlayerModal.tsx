import * as React from 'react';
import { EditPlayerModal } from '@panomc/panel-ui';

const M = EditPlayerModal as any;

// Real call site (Players.svelte / PlayerDetailLayout): show(player) with the
// player row. NOTE: the template unconditionally calls
// hasPermission(MANAGE_PLAYERS, $page.data.user) (page shim has no user) and reads
// $Languages[$siteInfo.platformLocale].name (Languages store is seeded by a
// network call; demo siteInfo has no platformLocale) — both config-level demo
// context gaps. Preview is authored so it lights up once those are added.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show({
        id: 12,
        username: 'Alex',
        email: 'alex@craftrealms.example',
        isEmailVerified: true,
        canCreateTicket: true,
        localeCode: null,
        registerDate: 1735689600000,
        lastLoginDate: 1751587200000,
        isBanned: false,
      });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <EditPlayerModal previewOpen />;
};

export const EditAlex = () => <Opened />;
