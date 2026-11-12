/**
 * Every message format the template editor knows: its model functions (`blankModel`, `parseModel`,
 * `modelToTemplate`), its visual editor and its preview. `JSON` has none (the plain envelope).
 */
import * as custom from './custom.js';
import CustomPreview from './CustomPreview.svelte';
import CustomVisual from './CustomVisual.svelte';
import * as discord from './discord.js';
import DiscordPreview from './DiscordPreview.svelte';
import DiscordVisual from './DiscordVisual.svelte';
import * as slack from './slack.js';
import SlackPreview from './SlackPreview.svelte';
import SlackVisual from './SlackVisual.svelte';
import * as teams from './teams.js';
import TeamsPreview from './TeamsPreview.svelte';
import TeamsVisual from './TeamsVisual.svelte';
import * as telegram from './telegram.js';
import TelegramPreview from './TelegramPreview.svelte';
import TelegramVisual from './TelegramVisual.svelte';

export const FORMAT_ADAPTERS = {
  DISCORD: { ...discord, Visual: DiscordVisual, Preview: DiscordPreview },
  SLACK: { ...slack, Visual: SlackVisual, Preview: SlackPreview },
  TELEGRAM: { ...telegram, Visual: TelegramVisual, Preview: TelegramPreview },
  TEAMS: { ...teams, Visual: TeamsVisual, Preview: TeamsPreview },
  CUSTOM: { ...custom, Visual: CustomVisual, Preview: CustomPreview },
};

/** The adapter of a format, or null for one without templates. */
export const adapterOf = (format) => FORMAT_ADAPTERS[format] ?? null;

/** `true` for a format whose endpoints take a template per event. */
export const isTemplated = (format) => adapterOf(format) !== null;
