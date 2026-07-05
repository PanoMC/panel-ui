import * as React from 'react';
import { CreatePermissionGroupModal } from '@panomc/panel-ui';

// Permissions.svelte opens this via show({ allGroups, newGroup }) for both create and edit.
const allGroups = [
  { id: 1, name: 'default', displayName: 'Member', weight: 0, parents: [] },
  { id: 2, name: 'vip', displayName: 'VIP', weight: 10, parents: ['default'] },
  { id: 3, name: 'helper', displayName: 'Helper', weight: 20, parents: ['default'] },
  { id: 4, name: 'moderator', displayName: 'Moderator', weight: 50, parents: ['helper'] },
  { id: 5, name: 'admin', displayName: 'Admin', weight: 100, parents: ['moderator'] },
];

const Opened = ({ payload }: { payload: Record<string, unknown> }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (CreatePermissionGroupModal as any).show(payload);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (CreatePermissionGroupModal as any).hide?.(); } catch {}
    };
  }, []);
  return <CreatePermissionGroupModal previewOpen />;
};

// Creating a brand-new group: empty form, parent selector with all existing groups.
export const CreateGroup = () => <Opened payload={{ allGroups }} />;

// Editing the "moderator" group: prefilled fields, parents list and Save footer button.
export const EditGroup = () => (
  <Opened
    payload={{
      allGroups,
      newGroup: {
        name: 'moderator',
        displayName: 'Moderator',
        weight: 50,
        parents: ['helper', 'vip'],
      },
    }}
  />
);
