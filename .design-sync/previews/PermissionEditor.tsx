import * as React from 'react';
import { PermissionEditor } from '@panomc/panel-ui';

// Permission nodes as built by createPermissionNode(): expiry is null or a Date.
// `value` is passed as a string so the <select value> matches its options.
// NOTE: showHeader must stay false — the header references an undefined
// openAddPermissionModal handler and crashes the whole render.
const nodes = [
  { permission: 'essentials.fly', value: 'true', expiry: null, contexts: 'none' },
  { permission: 'essentials.gamemode.creative', value: 'false', expiry: null, contexts: 'none' },
  { permission: 'worldedit.selection.*', value: 'true', expiry: null, contexts: 'none' },
];

const nodesWithExpiry = [
  { permission: 'craftrealms.vip', value: 'true', expiry: new Date('2026-08-01T18:00'), contexts: 'none' },
  { permission: 'craftrealms.vip.kit', value: 'true', expiry: new Date('2026-08-01T18:00'), contexts: 'none' },
  { permission: 'essentials.warp.donator', value: 'true', expiry: null, contexts: 'none' },
];

export const NodeList = () => (
  <PermissionEditor permissions={nodes} permissionGroupsCount={4} showHeader={false} />
);

export const TemporaryVipNodes = () => (
  <PermissionEditor permissions={nodesWithExpiry} permissionGroupsCount={4} showHeader={false} />
);

export const EmptyState = () => (
  <PermissionEditor permissions={[]} permissionGroupsCount={4} showHeader={false} />
);
