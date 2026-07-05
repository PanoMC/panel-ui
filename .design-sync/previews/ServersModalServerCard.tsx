import * as React from 'react';
import { ServersModalServerCard } from '@panomc/panel-ui';

// The card renders inside a Bootstrap grid `col` — give it the same row context
// as ServersModal (row-cols) so it sizes like a real modal cell.
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="row row-cols-2 g-3" style={{ maxWidth: 420 }}>
    {children}
  </div>
);

const noop = () => {};

// Inline grass-block favicon: the app's /assets/img/server-icon.png fallback
// is not served in the preview sandbox, so ship the icon as a data URI.
const grassIcon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAl0lEQVR4nO2UsQmAMBREzxvAItjYOIhT2LiEG7icw9jYSAonsIggiDFgct3/1Yd/eQcXuGpaBr8eAFxXKxZK6QAopbuuppRuEVlERZZqHnsAu98a1yI+vwXc/Qbg43GmgDp0EFCHDoKnQfHEGDvko28D6T9Th74NROggeDEomxhjh3x0GOrQl4FVRUpgVZEUWFUkBfKqOAEqMAOfgQ+1agAAAABJRU5ErkJggg==';

// id 1 matches the demo context's selectedServer AND mainServer ("CraftRealms Survival"),
// so this cell shows the crown + primary border + "Selected" footer.
const selectedMainServer = {
  id: 1,
  name: 'CraftRealms Survival',
  remoteAddress: 'play.craftrealms.net',
  status: 'ONLINE',
  type: 'SPIGOT',
  playerCount: 42,
  maxPlayerCount: 100,
  favicon: grassIcon,
};

const lobbyServer = {
  id: 2,
  name: 'CraftRealms Lobby',
  remoteAddress: 'lobby.craftrealms.net',
  status: 'ONLINE',
  type: 'VELOCITY',
  playerCount: 87,
  maxPlayerCount: 250,
  favicon: grassIcon,
};

const creativeServer = {
  id: 3,
  name: 'CraftRealms Creative',
  customName: 'Creative Plots',
  remoteAddress: 'creative.craftrealms.net',
  status: 'OFFLINE',
  type: 'PAPER',
  playerCount: 0,
  maxPlayerCount: 60,
  favicon: grassIcon,
};

export const SelectedMainServer = () => (
  <Row>
    <ServersModalServerCard
      server={selectedMainServer}
      selectingServerId={null as unknown as number}
      copiedId={null as unknown as number}
      onSelectCard={noop}
      onCopy={noop}
    />
  </Row>
);

export const OnlineServer = () => (
  <Row>
    <ServersModalServerCard
      server={lobbyServer}
      selectingServerId={null as unknown as number}
      copiedId={null as unknown as number}
      onSelectCard={noop}
      onCopy={noop}
    />
  </Row>
);

export const OfflineServer = () => (
  <Row>
    <ServersModalServerCard
      server={creativeServer}
      selectingServerId={null as unknown as number}
      copiedId={null as unknown as number}
      onSelectCard={noop}
      onCopy={noop}
    />
  </Row>
);

export const SelectingSpinner = () => (
  <Row>
    <ServersModalServerCard
      server={lobbyServer}
      selectingServerId={2}
      copiedId={null as unknown as number}
      onSelectCard={noop}
      onCopy={noop}
    />
  </Row>
);

export const DimmedWhileOtherSelecting = () => (
  <Row>
    <ServersModalServerCard
      server={creativeServer}
      selectingServerId={2}
      copiedId={null as unknown as number}
      onSelectCard={noop}
      onCopy={noop}
    />
  </Row>
);
