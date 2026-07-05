import * as React from 'react';
import { UnnecessaryTranslationsAlert } from '@panomc/panel-ui';

// Shape from src/lib/pages/Translations.svelte + TranslationRow: rows that are
// no longer part of the language file (notExists → delete button shown).
const obsoletePanelRows = [
  {
    key: 'pages.players.old-ban-note',
    original: 'Ban note',
    custom: 'Note shown to banned players',
    notExists: true,
  },
  {
    key: 'pages.dashboard.legacy-welcome',
    original: 'Welcome back!',
    custom: 'Welcome back to CraftRealms, {username}!',
    notExists: true,
  },
];

const obsoletePluginRows = [
  {
    key: 'plugins.discord-webhooks.legacy-ping-message',
    original: 'New post published!',
    custom: 'A new CraftRealms announcement is live! @everyone',
    notExists: true,
  },
];

export const OpenWithRows = () => (
  <UnnecessaryTranslationsAlert
    translations={obsoletePanelRows}
    pluginId={null as any}
    open={true}
    onCustomInputChange={() => {}}
    onDeleteClick={() => {}}
  />
);

export const PluginTranslations = () => (
  <UnnecessaryTranslationsAlert
    translations={obsoletePluginRows}
    pluginId="discord-webhooks"
    open={true}
    onCustomInputChange={() => {}}
    onDeleteClick={() => {}}
  />
);

export const Collapsed = () => (
  <UnnecessaryTranslationsAlert
    translations={obsoletePanelRows}
    pluginId={null as any}
    open={false}
    onCustomInputChange={() => {}}
    onDeleteClick={() => {}}
  />
);
