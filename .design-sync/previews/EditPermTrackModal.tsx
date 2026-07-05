import * as React from 'react';
import { EditPermTrackModal } from '@panomc/panel-ui';

// Permissions.svelte opens this via show({ permissionGroups }) to add a track and
// show({ track, permissionGroups }) to edit one.
const permissionGroups = [
  { id: 1, name: 'default', displayName: 'Member', weight: 0 },
  { id: 2, name: 'vip', displayName: 'VIP', weight: 10 },
  { id: 3, name: 'helper', displayName: 'Helper', weight: 20 },
  { id: 4, name: 'moderator', displayName: 'Moderator', weight: 50 },
  { id: 5, name: 'admin', displayName: 'Admin', weight: 100 },
];

const Opened = ({ payload }: { payload: Record<string, unknown> }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (EditPermTrackModal as any).show(payload);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (EditPermTrackModal as any).hide?.(); } catch {}
    };
  }, []);
  return <EditPermTrackModal previewOpen />;
};

// New track: empty name/description, draggable group pills, empty dropzone.
export const AddTrack = () => <Opened payload={{ permissionGroups }} />;

// Editing the staff promotion ladder: ordered helper → moderator → admin sequence.
export const EditStaffLadder = () => (
  <Opened
    payload={{
      permissionGroups,
      track: {
        id: 1,
        name: 'Staff Ladder',
        description: 'Promotion path for CraftRealms staff: Helper → Moderator → Admin.',
        groupNames: ['helper', 'moderator', 'admin'],
      },
    }}
  />
);
