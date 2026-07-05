import * as React from 'react';
import { EditPermissionNodeModal } from '@panomc/panel-ui';

// Permissions.svelte opens this via show({ node, permissionGroups, isAdd?, siblingNodes?, ... }).
const permissionGroups = [
  { id: 1, name: 'default', displayName: 'Member', weight: 0 },
  { id: 3, name: 'helper', displayName: 'Helper', weight: 20 },
  { id: 4, name: 'moderator', displayName: 'Moderator', weight: 50 },
  { id: 5, name: 'admin', displayName: 'Admin', weight: 100 },
];

const Opened = ({ payload }: { payload: Record<string, unknown> }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (EditPermissionNodeModal as any).show(payload);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (EditPermissionNodeModal as any).hide?.(); } catch {}
    };
  }, []);
  return <EditPermissionNodeModal previewOpen />;
};

// Editing an existing grant on the "moderator" group: monospace node input, active switch,
// never/date expiry radio group, empty contexts area.
export const EditNode = () => (
  <Opened
    payload={{
      node: {
        id: 101,
        holderType: 'GROUP',
        holderId: 4,
        node: 'pano.panel.manage.tickets',
        active: true,
        expiresAt: null,
        context: {},
      },
      permissionGroups,
    }}
  />
);

// Adding a new node to a group: "Add Permission Node" title and Add footer button.
export const AddNode = () => (
  <Opened
    payload={{
      node: {
        id: Date.now(),
        holderType: 'GROUP',
        holderId: 3,
        node: '',
        active: true,
        expiresAt: null,
        context: {},
      },
      permissionGroups,
      isAdd: true,
    }}
  />
);

// A pano:true context marks the node panel-only — warning alert with a docs link.
export const PanoOnlyContext = () => (
  <Opened
    payload={{
      node: {
        id: 102,
        holderType: 'GROUP',
        holderId: 5,
        node: 'pano.panel.manage.players',
        active: true,
        expiresAt: null,
        context: { pano: 'true' },
      },
      permissionGroups,
    }}
  />
);

// Temporary VIP rank on user Alex: date expiry selected with a datetime picker,
// plus a game-only (pano:false) context and a server context row.
export const TemporaryWithExpiry = () => (
  <Opened
    payload={{
      node: {
        id: 103,
        holderType: 'USER',
        holderId: 7,
        holderName: 'Alex',
        node: 'group.vip',
        active: true,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        context: { pano: 'false', server: 'survival' },
      },
      permissionGroups,
    }}
  />
);
