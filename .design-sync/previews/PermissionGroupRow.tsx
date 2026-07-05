import * as React from 'react';
import { PermissionGroupRow } from '@panomc/panel-ui';

const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="card">
    <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}`}</style>
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 ds-rt">
        <thead>
          <tr>
            {['', 'Group', 'Permissions', 'Players'].map((c, i) => (
              <th key={i} scope="col" className="text-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  </div>
);

export const AdminGroup = () => (
  <Table>
    <PermissionGroupRow permissionGroup={{ id: 1, name: 'admin', permissionCount: 11, userCount: 2 }} />
  </Table>
);

export const ModeratorGroup = () => (
  <Table>
    <PermissionGroupRow
      permissionGroup={{ id: 2, name: 'moderator', permissionCount: 5, userCount: 8 }}
    />
  </Table>
);

export const GroupList = () => (
  <Table>
    <PermissionGroupRow permissionGroup={{ id: 1, name: 'admin', permissionCount: 11, userCount: 2 }} />
    <PermissionGroupRow
      permissionGroup={{ id: 2, name: 'moderator', permissionCount: 5, userCount: 8, selected: true }}
    />
    <PermissionGroupRow permissionGroup={{ id: 3, name: 'builder', permissionCount: 3, userCount: 14 }} />
    <PermissionGroupRow permissionGroup={{ id: 4, name: 'vip', permissionCount: 1, userCount: 37 }} />
  </Table>
);
