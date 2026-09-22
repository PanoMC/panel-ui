<!-- "Are you sure?" before every one-click update (SM-77): the Pano plugin, a Pano Agent, a node.
     Mounted once by the Sidebar; [confirmUpdate] resolves with the admin's answer, and what the
     update does afterwards shows up wherever that thing is shown — never in this dialog. -->
<div
  class="modal fade"
  tabindex="-1"
  aria-hidden="true"
  aria-labelledby="confirmUpdateTitle"
  bind:this={modalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fa-solid fa-download fa-3x d-block m-auto text-gray" aria-hidden="true"></i>
        </div>
        <h5 class="mb-2 text-break" id="confirmUpdateTitle">{request.title}</h5>
        {#each request.lines as line, index (index)}
          <div class="text-body-secondary small text-break">{line}</div>
        {/each}
      </div>
      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0" onclick={() => answer(false)}>
          {$_('buttons.cancel')}
        </button>
        <button type="button" class="btn btn-warning col-6 m-0" onclick={() => answer(true)}>
          {request.confirmLabel || $_('buttons.update')}
        </button>
      </div>
    </div>
  </div>
</div>

<script module>
  import { get } from 'svelte/store';
  import { _ as translator } from 'svelte-i18n';

  /**
   * @typedef {{ title: string, message?: string | string[], confirmLabel?: string }} ConfirmUpdateRequest
   */

  /** @type {((request: ConfirmUpdateRequest, resolve: (confirmed: boolean) => void) => void) | null} */
  let openModal = null;

  /**
   * @param {string | string[] | undefined} message
   * @returns {string[]} the non-empty lines of [message].
   */
  function linesOf(message) {
    return (Array.isArray(message) ? message : [message])
      .map((line) => String(line ?? '').trim())
      .filter(Boolean);
  }

  /**
   * Asks whether to go ahead with an update. Resolves true on Update, false on Cancel or when the
   * dialog is closed any other way (or replaced by another question).
   *
   * @param {ConfirmUpdateRequest} request
   * @returns {Promise<boolean>}
   */
  export function confirmUpdate({ title, message = '', confirmLabel = '' }) {
    if (openModal) {
      const open = openModal;

      return new Promise((resolve) => open({ title, message, confirmLabel }, resolve));
    }

    // Not mounted (a page outside the panel shell): the browser still asks before anything runs.
    if (typeof window === 'undefined') {
      return Promise.resolve(false);
    }

    return Promise.resolve(window.confirm([title, ...linesOf(message)].join('\n\n')));
  }

  /**
   * @param {string | null | undefined} current
   * @param {string | null | undefined} latest
   * @returns {string} "current → latest", or '' while either is unknown.
   */
  function versionLine(current, latest) {
    const from = String(current ?? '').trim();
    const to = String(latest ?? '').trim();

    return from && to && from !== to ? `${from} → ${to}` : '';
  }

  /**
   * @param {{ name: string, current?: string | null, latest?: string | null }} target
   * @returns {Promise<boolean>}
   */
  export function confirmPanoPluginUpdate({ name, current = null, latest = null }) {
    const t = get(translator);

    return confirmUpdate({
      title: t('components.modals.confirm-update.pano-plugin-title', { values: { server: name } }),
      message: [
        versionLine(current, latest),
        t('components.modals.confirm-update.pano-plugin-body'),
      ],
    });
  }

  /**
   * @param {number} count how many servers the update goes to.
   * @returns {Promise<boolean>}
   */
  export function confirmPanoPluginUpdateAll(count) {
    const t = get(translator);

    return confirmUpdate({
      title: t('components.modals.confirm-update.all-plugins-title', { values: { count } }),
      message: t('components.modals.confirm-update.all-plugins-body'),
    });
  }

  /**
   * @param {{ name: string, current?: string | null, latest?: string | null }} target the server
   *   the agent runs.
   * @returns {Promise<boolean>}
   */
  export function confirmAgentUpdate({ name, current = null, latest = null }) {
    const t = get(translator);

    return confirmUpdate({
      title: t('components.modals.confirm-update.agent-title', { values: { server: name } }),
      message: [versionLine(current, latest), t('components.modals.confirm-update.agent-body')],
    });
  }

  /**
   * @param {{ name: string, current?: string | null, latest?: string | null }} target the node.
   * @returns {Promise<boolean>}
   */
  export function confirmNodeUpdate({ name, current = null, latest = null }) {
    const t = get(translator);

    return confirmUpdate({
      title: t('components.modals.confirm-update.node-title', { values: { node: name } }),
      message: [versionLine(current, latest), t('components.modals.confirm-update.node-body')],
    });
  }
</script>

<script>
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  let modalElement = $state();
  let request = $state({ title: '', lines: /** @type {string[]} */ ([]), confirmLabel: '' });

  let modal;
  /** @type {((confirmed: boolean) => void) | null} */
  let resolveCurrent = null;

  /**
   * @param {boolean} confirmed
   */
  function settle(confirmed) {
    const resolve = resolveCurrent;

    resolveCurrent = null;
    resolve?.(confirmed);
  }

  /**
   * @param {boolean} confirmed
   */
  function answer(confirmed) {
    settle(confirmed);
    modal?.hide();
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement)
      : null;

    openModal = (next, resolve) => {
      // A second question answers the first one with "no".
      settle(false);

      request = {
        title: next.title,
        lines: linesOf(next.message),
        confirmLabel: next.confirmLabel || '',
      };
      resolveCurrent = resolve;

      if (!modal) {
        settle(window.confirm([next.title, ...request.lines].join('\n\n')));

        return;
      }

      modal.show();
    };

    // Escape, the backdrop, the close of a route change: all of them are "no".
    const onHidden = () => settle(false);

    modalElement?.addEventListener('hidden.bs.modal', onHidden);

    return () => {
      modalElement?.removeEventListener('hidden.bs.modal', onHidden);
    };
  });

  onDestroy(() => {
    settle(false);
    openModal = null;
  });
</script>
