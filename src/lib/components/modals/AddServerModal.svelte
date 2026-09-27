<!-- Add Server chooser (§3): create a server Pano runs, or link one that already exists. -->
<div
  aria-hidden="true"
  aria-labelledby="addServerTitle"
  class="modal fade"
  id="addServer"
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="addServerTitle">{$_('components.modals.add-server.title')}</h5>
        <button
          class="btn-close"
          aria-label={$_('buttons.close')}
          data-bs-dismiss="modal"
          type="button">
        </button>
      </div>

      <div class="modal-body">
        <!-- One row per way in, the shape the backup options use: the title leads, the sentence
             below says what it does, and the whole row is the click target. -->
        <div class="list-group">
          {#if canCreate}
            <button
              type="button"
              class="list-group-item list-group-item-action text-start"
              onclick={openCreate}>
              <span class="d-flex align-items-center gap-2 mb-1">
                <i class="fa-solid fa-plus text-success" aria-hidden="true"></i>
                <span class="fw-semibold">{$_('components.modals.add-server.create-title')}</span>
              </span>
              <span class="text-body-secondary">
                {$_('components.modals.add-server.create-description')}
              </span>
            </button>
          {/if}

          <!-- Link, run by Pano: pano-agent.jar goes into the server's own folder and the server
               is started with it from then on. -->
          {#if canCreate}
            <button
              type="button"
              class="list-group-item list-group-item-action text-start"
              onclick={openLinkWithAgent}>
              <span class="d-flex align-items-center gap-2 mb-1">
                <i class="fa-solid fa-microchip text-secondary" aria-hidden="true"></i>
                <span class="fw-semibold">
                  {$_('components.modals.add-server.link-agent-title')}
                </span>
              </span>
              <span class="text-body-secondary">
                {$_('components.modals.add-server.link-agent-description')}
              </span>
            </button>
          {/if}

          <button
            type="button"
            class="list-group-item list-group-item-action text-start"
            onclick={openLink}>
            <span class="d-flex align-items-center gap-2 mb-1">
              <i class="fa-solid fa-plug text-info" aria-hidden="true"></i>
              <span class="fw-semibold">{$_('components.modals.add-server.link-title')}</span>
            </span>
            <span class="text-body-secondary">
              {$_('components.modals.add-server.link-description')}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { normalizeUsageMode, UsageModes } from '$lib/navigation.util.js';
  import { show as showConnectServerModal } from './ConnectServerModal.svelte';
  import { show as showAgentLinkModal } from './AgentLinkModal.svelte';

  const MODAL_ID = 'addServer';

  /**
   * The create wizard registers itself here (`CreateServerModal`), so the chooser can offer
   * "Create" without importing the wizard — and still behaves when a build ships without it.
   *
   * @type {((options?: { source?: string }) => void) | null}
   */
  let createOpener = null;

  /**
   * @param {(options?: { source?: string }) => void} opener
   * @returns {() => void} unregister function.
   */
  export function setCreateServerOpener(opener) {
    createOpener = opener;

    return () => {
      if (createOpener === opener) {
        createOpener = null;
      }
    };
  }

  /**
   * Open the right "add a server" flow for this install: the chooser when Pano can create
   * servers, the plain link-an-existing-server modal in a website-only install or for an
   * admin who may not create servers (§3 — a permanently absent option is hidden, not
   * disabled).
   *
   * @param {unknown} usageMode the `usageMode` context value.
   */
  export function show(usageMode) {
    if (typeof window === 'undefined' || !window.bootstrap?.Modal) {
      return;
    }

    const element = document.getElementById(MODAL_ID);

    if (
      !element ||
      normalizeUsageMode(usageMode) === UsageModes.WEBSITE ||
      !hasPermission(Permissions.CREATE_SERVERS)
    ) {
      showConnectServerModal();

      return;
    }

    window.bootstrap.Modal.getOrCreateInstance(element).show();
  }

  /**
   * Bootstrap refuses to stack two modals, so the chooser hides first and the next modal
   * opens once its fade-out finished.
   *
   * @param {() => void} next
   */
  function hideThen(next) {
    const element = document.getElementById(MODAL_ID);

    if (!element || !window.bootstrap?.Modal) {
      next();

      return;
    }

    element.addEventListener('hidden.bs.modal', next, { once: true });
    window.bootstrap.Modal.getOrCreateInstance(element).hide();
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { showError } from '$lib/components/ToastContainer.svelte';

  const canCreate = hasPermission(Permissions.CREATE_SERVERS);

  function openLink() {
    hideThen(showConnectServerModal);
  }

  function openLinkWithAgent() {
    hideThen(showAgentLinkModal);
  }

  function openCreate() {
    hideThen(() => {
      if (!createOpener) {
        void showError('components.modals.add-server.create-unavailable');

        return;
      }

      createOpener();
    });
  }
</script>
