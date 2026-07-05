import * as React from 'react';
import { DefaultToast } from '@panomc/panel-ui';

// Bootstrap hides .toast until the JS runtime adds .show — force it visible
// so the static preview matches what ToastContainer.show() produces.
const ForceShow = () => (
  <style>{`.toast{display:block !important; opacity:1 !important;}`}</style>
);

// Real call sites: showToast('components.toasts.post-published', { title }) etc.
export const PostPublished = () => (
  <>
    <ForceShow />
    <DefaultToast id="1" text="components.toasts.post-published" values={{ title: 'Announcing Season 5!' }} />
  </>
);

export const PlayerDeleted = () => (
  <>
    <ForceShow />
    <DefaultToast id="2" text="components.toasts.player-deleted-success" values={{ username: 'Griefer_2010' }} />
  </>
);

export const LicenseRefreshed = () => (
  <>
    <ForceShow />
    <DefaultToast id="3" text="components.toasts.license-refreshed" values={{}} />
  </>
);
