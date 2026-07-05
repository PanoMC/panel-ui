import * as React from 'react';
import { PlayerStatusBadge } from '@panomc/panel-ui';

export const Online = () => <PlayerStatusBadge lastActivityTime={Date.now()} />;

export const InGame = () => <PlayerStatusBadge lastActivityTime={Date.now()} inGame={1} />;

export const Offline = () => (
  <PlayerStatusBadge lastActivityTime={Date.now() - 3 * 24 * 60 * 60 * 1000} checkTime={Date.now()} />
);

export const Banned = () => <PlayerStatusBadge banned />;
