import * as React from 'react';
import { Editor } from '@panomc/panel-ui';

// TipTap rich-text editor — used by PostEditor (bind:content) and
// TicketDetail (reply box with a send button in the default slot).

const announcementHtml = `
<h2>Season 8 — The Nether Update</h2>
<p>Greetings, CraftRealms players! Season 8 launches this <strong>Friday at 18:00 UTC</strong> with a fresh survival map and a reworked Nether.</p>
<ul>
  <li>New warp: <em>/warp bastion</em> — weekly loot rotation</li>
  <li>Piglin bartering rebalanced for the server economy</li>
  <li>Claim size raised to 60x60 for Veteran rank</li>
</ul>
<p>See you on the server,<br>— The CraftRealms Team</p>
`;

export const PostContent = () => (
  <Editor content={announcementHtml} isEmpty={false} contentStyles="height: 280px;" />
);

export const WithHtmlAndPreviewToggles = () => (
  <Editor
    content="<p>Maintenance window: the server restarts every day at <strong>04:00 UTC</strong>. Pending chunk pre-generation for the 1.21.4 world border expansion will run afterwards.</p>"
    isEmpty={false}
    showHtml
    showPreview
    contentStyles="height: 160px;"
  />
);

export const TicketReply = () => (
  <Editor
    content="<p>Hi Alex, we checked the logs — your diamonds were removed by a hopper minecart at spawn chunk (12, -40). We have restored your inventory from last night's backup.</p>"
    isEmpty={false}
    contentStyles="height: 120px;"
  >
    <button className="btn btn-secondary" type="button" title="Send" aria-label="Send">
      <i className="fas fa-paper-plane"></i>
    </button>
  </Editor>
);
