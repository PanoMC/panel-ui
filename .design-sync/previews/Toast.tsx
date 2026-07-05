import * as React from 'react';
import { Toast } from '@panomc/panel-ui';

// Bootstrap hides .toast until the JS runtime adds .show — the shell is pure
// markup, so previews force it visible the same way the app's toast runtime would.
const ForceShow = () => (
  <style>{`.toast{display:block !important; opacity:1 !important;}`}</style>
);

export const PostPublished = () => (
  <>
    <ForceShow />
    <Toast id="1">
      <span>"Announcing Season 5!" is published.</span>
    </Toast>
  </>
);

export const PlayerBanned = () => (
  <>
    <ForceShow />
    <Toast id="2">
      <span>"Griefer_2010" user banned.</span>
    </Toast>
  </>
);

export const RichBody = () => (
  <>
    <ForceShow />
    <Toast id="3">
      <span>
        <i className="fa-solid fa-circle-check text-success me-2"></i>
        Server <b>CraftRealms Survival</b> connected.
      </span>
    </Toast>
  </>
);
