import * as React from 'react';
import { ViewComponent } from '@panomc/panel-ui';

// ViewComponent renders whatever compiled Svelte component a plugin hands it
// (module shape: { default: Component }). The demo module below mimics a
// plugin-provided panel widget the same way the plugin-UI loader supplies one.

// Minimal Svelte-5-compatible client component: (anchor, props) => insert DOM.
function DiscordWidget(anchor: any, props: any) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML =
    '<div class="card-body">' +
    '<div class="d-flex justify-content-between align-items-center mb-2">' +
    '<h6 class="fw-bold mb-0"><i class="fab fa-discord me-2"></i>Discord Bridge</h6>' +
    '<span class="badge text-bg-success">Linked</span>' +
    '</div>' +
    `<p class="mb-1">Guild: <strong>${props?.guildName ?? 'CraftRealms'}</strong></p>` +
    `<small class="text-body-secondary">${props?.linkedMembers ?? 0} members linked to Minecraft accounts</small>` +
    '</div>';
  anchor.before(el);
}

export const PluginProvidedView = () => (
  <ViewComponent
    {...({
      component: { default: DiscordWidget },
      guildName: 'CraftRealms Community',
      linkedMembers: 318,
    } as any)}
  />
);
