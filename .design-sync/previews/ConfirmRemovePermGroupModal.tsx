import * as React from 'react';
import { ConfirmRemovePermGroupModal } from '@panomc/panel-ui';

// Opened imperatively from Permissions page: show(group, nodes).
// Admin state is derived from nodes: holderType GROUP + node '*' on the group's id.
const Opened = ({ group, nodes }: { group: any; nodes: any[] }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemovePermGroupModal as any).show(group, nodes);
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmRemovePermGroupModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmRemovePermGroupModal previewOpen />;
};

export const RegularGroup = () => (
  <Opened
    group={{ id: 3, name: 'moderator', displayName: 'Moderator' }}
    nodes={[
      { holderType: 'GROUP', holderId: 3, node: 'pano.ticket.manage', active: true },
      { holderType: 'GROUP', holderId: 3, node: 'pano.player.ban', active: true },
    ]}
  />
);

export const AdminGroup = () => (
  <Opened
    group={{ id: 1, name: 'admin', displayName: 'Administrators' }}
    nodes={[
      { holderType: 'GROUP', holderId: 1, node: '*', active: true },
      { holderType: 'GROUP', holderId: 2, node: '*', active: true },
      { holderType: 'GROUP', holderId: 3, node: 'pano.ticket.manage', active: true },
    ]}
  />
);

export const LastAdminGroup = () => (
  <Opened
    group={{ id: 1, name: 'admin', displayName: 'Administrators' }}
    nodes={[
      { holderType: 'GROUP', holderId: 1, node: '*', active: true },
      { holderType: 'GROUP', holderId: 3, node: 'pano.ticket.manage', active: true },
    ]}
  />
);
