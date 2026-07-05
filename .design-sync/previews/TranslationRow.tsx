import * as React from 'react';
import { TranslationRow } from '@panomc/panel-ui';

// Rendered inside the Translations page form column.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="card">
    <div className="card-body">{children}</div>
  </div>
);

export const Translated = () => (
  <Frame>
    <TranslationRow
      pluginId={null}
      translation={{
        key: 'pages.dashboard.quick-statistics',
        original: 'Quick Statistics',
        custom: 'Server Stats',
        notExists: false,
      }}
    />
  </Frame>
);

export const Untranslated = () => (
  <Frame>
    <TranslationRow
      pluginId={null}
      translation={{
        key: 'pages.tickets.waiting-reply',
        original: 'Waiting for reply',
        custom: '',
        notExists: false,
      }}
    />
  </Frame>
);

export const RemovedKey = () => (
  <Frame>
    <TranslationRow
      pluginId={null}
      translation={{
        key: 'pages.settings.legacy-webhook-note',
        original: 'This key no longer exists in the platform',
        custom: 'Discord webhook ayarları taşındı',
        notExists: true,
      }}
    />
  </Frame>
);

export const PluginTranslation = () => (
  <Frame>
    <TranslationRow
      pluginId="discord-integration"
      translation={{
        key: 'plugins.discord-integration.settings.webhook-url',
        original: 'Webhook URL',
        custom: 'Discord Webhook Adresi',
        notExists: false,
      }}
    />
  </Frame>
);
