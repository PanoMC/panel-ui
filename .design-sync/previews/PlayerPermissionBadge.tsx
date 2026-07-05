import * as React from 'react';
import { PlayerPermissionBadge } from '@panomc/panel-ui';

export const Admin = () => (
  <PlayerPermissionBadge permissionGroup={{ name: 'admin', displayName: 'admin' }} />
);

export const Moderator = () => (
  <PlayerPermissionBadge permissionGroup={{ name: 'moderator', displayName: 'moderator' }} />
);

export const VipMember = () => (
  <PlayerPermissionBadge permissionGroup={{ name: 'vip', displayName: 'VIP member' }} />
);
