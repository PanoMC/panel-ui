import * as React from 'react';
import { PageNav, PageNavItem } from '@panomc/panel-ui';

// Mirrors SettingsLayout.svelte: top-level settings tabs
export const SettingsTabs = () => (
  <PageNav>
    <PageNavItem href="/settings" active><>Website</></PageNavItem>
    <PageNavItem href="/settings/platform"><>Platform</></PageNavItem>
    <PageNavItem href="/settings/updates"><>Updates</></PageNavItem>
    <PageNavItem href="/settings/about"><>About</></PageNavItem>
  </PageNav>
);

// Mirrors PlayerDetailLayout.svelte: player detail sub-pages
export const PlayerDetailTabs = () => (
  <PageNav>
    <PageNavItem href="/players/detail/Herobrine"><>Overview</></PageNavItem>
    <PageNavItem href="/players/detail/Herobrine/sessions" active><>Sessions</></PageNavItem>
    <PageNavItem href="/players/detail/Herobrine/ban-history"><>Ban History</></PageNavItem>
  </PageNav>
);

// Many tabs: the container scrolls horizontally instead of wrapping
export const ManyTabsScrollable = () => (
  <div style={{ maxWidth: 420 }}>
    <PageNav>
      <PageNavItem href="/server/settings" active><>Server</></PageNavItem>
      <PageNavItem href="/server/settings/game-integration"><>Game Integration</></PageNavItem>
      <PageNavItem href="/server/settings/whitelist"><>Whitelist</></PageNavItem>
      <PageNavItem href="/server/settings/motd"><>MOTD</></PageNavItem>
      <PageNavItem href="/server/settings/backups"><>Backups</></PageNavItem>
      <PageNavItem href="/server/settings/danger-zone"><>Danger Zone</></PageNavItem>
    </PageNav>
  </div>
);
