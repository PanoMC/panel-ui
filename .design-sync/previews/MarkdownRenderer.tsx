import * as React from 'react';
import { MarkdownRenderer } from '@panomc/panel-ui';

const post = `## Season 5 is live!

The new **CraftRealms** season begins today. Here is what changed:

- Fresh survival map with custom terrain generation
- New /warp hub with player shops
- Economy reset — everyone starts with 500 coins

Read the full changelog on [our forum](https://example.com) before you join.

\`/server survival\` gets you in from the lobby.`;

export const NewsPost = () => <MarkdownRenderer content={post} />;

export const ShortNote = () => (
  <MarkdownRenderer content="Maintenance tonight **22:00 UTC** — expect ~15 minutes of downtime." />
);
