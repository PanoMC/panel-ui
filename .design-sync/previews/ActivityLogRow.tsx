import * as React from 'react';
import { ActivityLogRow } from '@panomc/panel-ui';

// Used on Dashboard + ActivityLogs pages inside a list-group.
const Feed = ({ children }: { children: React.ReactNode }) => (
  <div className="card">
    <div className="list-group list-group-flush">{children}</div>
  </div>
);

const HOUR = 60 * 60 * 1000;

export const PlayerBanned = () => (
  <Feed>
    <ActivityLogRow
      log={{
        id: 501,
        type: 'BANNED_PLAYER',
        details: { username: 'Herobrine', player: 'xX_Griefer_Xx' },
        createdAt: Date.now() - 2 * HOUR,
      }}
    />
  </Feed>
);

export const PostUpdated = () => (
  <Feed>
    <ActivityLogRow
      log={{
        id: 502,
        type: 'UPDATED_POST',
        details: { username: 'Alex', title: 'Season 8 Reset Announcement' },
        createdAt: Date.now() - 26 * HOUR,
      }}
    />
  </Feed>
);

export const Selected = () => (
  <Feed>
    <ActivityLogRow
      log={{
        id: 503,
        type: 'CREATED_PERMISSION_GROUP',
        details: { username: 'Herobrine', permissionGroupName: 'Moderator' },
        createdAt: Date.now() - 5 * HOUR,
        selected: true,
      }}
    />
  </Feed>
);

export const ActivityFeed = () => (
  <Feed>
    <ActivityLogRow
      log={{
        id: 504,
        type: 'BANNED_IP',
        details: { username: 'Herobrine', ip: '203.0.113.42' },
        createdAt: Date.now() - 1 * HOUR,
      }}
    />
    <ActivityLogRow
      log={{
        id: 505,
        type: 'REPLIED_TICKET',
        details: { username: 'Alex', ticketId: 148 },
        createdAt: Date.now() - 8 * HOUR,
      }}
    />
    <ActivityLogRow
      log={{
        id: 506,
        type: 'NEW_LOCALE',
        details: { username: 'Herobrine', localeName: 'Türkçe' },
        createdAt: Date.now() - 30 * HOUR,
      }}
    />
  </Feed>
);
