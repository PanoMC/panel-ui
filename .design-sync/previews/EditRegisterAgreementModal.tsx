import * as React from 'react';
import { EditRegisterAgreementModal } from '@panomc/panel-ui';

const M = EditRegisterAgreementModal as any;

const AGREEMENT_HTML = `
<h2>CraftRealms Terms of Registration</h2>
<p>By creating an account on <strong>CraftRealms</strong> you agree to the following rules:</p>
<ul>
<li>No griefing, X-ray or fly hacks on any CraftRealms server.</li>
<li>Keep chat friendly — harassment leads to a permanent ban.</li>
<li>One account per player; alt accounts used to evade bans will be removed.</li>
</ul>
<p>Staff may suspend accounts that break these rules. Appeals go through the ticket system.</p>
`;

// Real call site (WebsiteSettings.svelte):
// showEditRegisterAgreementModal(data.registerAgreement, (html) => { ... }).
// Require-agreement checkbox on + TipTap editor seeded with the agreement HTML.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show(AGREEMENT_HTML, () => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <EditRegisterAgreementModal previewOpen />;
};

export const WithAgreement = () => <Opened />;
