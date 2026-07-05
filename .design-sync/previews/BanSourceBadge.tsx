import * as React from 'react';
import { BanSourceBadge } from '@panomc/panel-ui';

export const Panel = () => <BanSourceBadge source="PANEL" />;

export const Migration = () => <BanSourceBadge source="MIGRATION_LITEBANS" />;

export const Server = () => <BanSourceBadge source="SERVER" />;

export const OtherPlugin = () => <BanSourceBadge source="EssentialsX" />;
