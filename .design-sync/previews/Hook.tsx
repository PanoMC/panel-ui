import * as React from 'react';
import { Hook, panoApiClient } from '@panomc/panel-ui';

// Hook is the plugin extension point: a plugin bundle calls
// panoApiClient.ui.hook.register({ name, component }) and every <Hook name>
// slot mounts the registered module. Register a demo "Discord Bridge" plugin
// view before mounting, exactly like a plugin would — the module's default is
// a compiled-component-shaped (anchor, props) function, the same hand-written
// pattern the ViewComponent preview proves out.
let registered = false;
function registerDemoPluginView() {
  if (registered) return;
  registered = true;
  (panoApiClient as any).ui.hook.register({
    name: 'panel:post-editor:sidebar:after',
    component: {
      default: (anchor: any, props: any) => {
        const el = document.createElement('div');
        el.className = 'card border-primary text-start';
        el.innerHTML = `
          <div class="card-body p-2">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="fa-brands fa-discord text-primary"></i>
              <strong class="small">Discord Bridge</strong>
              <span class="badge text-bg-primary ms-auto">plugin</span>
            </div>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input" type="checkbox" checked id="ds-demo-announce" />
              <label class="form-check-label small" for="ds-demo-announce">
                Announce post #${props?.post?.id ?? '?'} to #news on publish
              </label>
            </div>
          </div>`;
        anchor.before(el);
      },
    },
  });
}

// Story: the PostEditor sidebar (usage: PostEditor.svelte,
// <Hook name="panel:post-editor:sidebar:after" post={post} />) with the
// registered plugin widget mounted into the slot.
export const PostEditorSidebarSlot = () => {
  registerDemoPluginView();
  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <ul className="list-group list-group-flush">
        <li className="list-group-item p-2">
          <label className="form-label mb-1">Category</label>
          <select className="form-select form-select-sm" defaultValue="announcements">
            <option value="announcements">Announcements</option>
            <option value="events">Events</option>
          </select>
        </li>
        <li className="list-group-item p-2">
          <span className="text-body-secondary small">
            The installed <strong>Discord Bridge</strong> plugin extends the sidebar via
            <code className="ms-1">panel:post-editor:sidebar:after</code>:
          </span>
        </li>
        <li className="list-group-item p-2">
          <Hook name="panel:post-editor:sidebar:after" {...({ post: { id: 12 } } as any)} />
        </li>
      </ul>
    </div>
  );
};
