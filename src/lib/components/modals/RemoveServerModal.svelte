<!-- Confirm Delete (managed) / Remove (linked) Server Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <form on:submit|preventDefault={sendDeleteServer}>
        <div class="modal-body text-center">
          <div class="pb-3">
            <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
          </div>
          {$_(
            $managed && !$inPlace
              ? 'components.modals.remove-server.delete-title'
              : 'components.modals.remove-server.remove-title',
          )}

          {#if !$managed}
            <div class="small text-body-secondary mt-2">
              {$_('components.modals.remove-server.remove-info')}
            </div>
          {:else if $inPlace}
            <!-- Run from its own folder: the node takes only its own files back out of it, and
                 the Pano Agent removes its .pano-agent folder (the jar is left to the admin).
                 Backups are Pano's and go. -->
            <div class="small text-body-secondary mt-2">
              {$_('components.modals.remove-server.in-place-info')}
              {#if $agent}
                {$_('components.modals.remove-server.agent-info')}
              {/if}
              {#if $backups !== null && $backups.count !== 0}
                {$_('components.modals.remove-server.in-place-backups')}
              {/if}
            </div>
          {:else}
            <!-- SM-64: a managed server takes its files and its backups with it. -->
            <div class="small text-body-secondary mt-2">
              {#if $backups === null}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                {$_('components.modals.remove-server.backups-loading')}
              {:else if $backups.count < 0}
                {$_('components.modals.remove-server.backups-all')}
              {:else if $backups.count === 0}
                {$_('components.modals.remove-server.no-backups')}
              {:else if $backups.bytes > 0}
                {$_('components.modals.remove-server.backups-size', {
                  values: { count: $backups.count, size: formatBytes($backups.bytes, 1) },
                })}
              {:else}
                {$_('components.modals.remove-server.backups', {
                  values: { count: $backups.count },
                })}
              {/if}
            </div>
          {/if}

          <input
            class="form-control zmt-3"
            placeholder={$_('components.modals.remove-server.account-password')}
            type="password"
            bind:value={$currentPassword}
            bind:this={$passwordInput}
            class:border-danger={$passwordError} />
        </div>

        <div class="modal-footer flex-nowrap">
          <button class="btn btn-link col-6 m-0" type="button" on:click={hide}
            >{$_('buttons.cancel')}</button>
          <button
            class="btn btn-danger col-6 m-0"
            type="button"
            disabled={confirmButtonDisabled}
            class:disabled={confirmButtonDisabled}
            on:click={sendDeleteServer}
            >{$_($managed && !$inPlace ? 'buttons.delete' : 'buttons.remove')}</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  import { fetchServerBackups, isAgentServer, isInPlace, isManaged } from '$lib/servers.util.js';

  const modalElement = writable();

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const server = writable({});
  const loading = writable(false);
  const passwordError = writable(false);
  const currentPassword = writable('');
  const passwordInput = writable();
  const managed = writable(false);
  const inPlace = writable(false);
  const agent = writable(false);
  /**
   * What the node deletes with a managed server: null while it is being read. A failed read
   * shows the count-less sentence, which is still true.
   *
   * @type {import('svelte/store').Writable<{ count: number, bytes: number } | null>}
   */
  const backups = writable(null);
  let generation = 0;

  /**
   * @param {object} target
   */
  async function readBackups(target) {
    const current = ++generation;

    backups.set(null);

    const result = await fetchServerBackups(target.id);

    if (current !== generation) {
      return;
    }

    if (result.status !== 'ok') {
      backups.set({ count: -1, bytes: 0 });

      return;
    }

    backups.set({
      count: result.backups.length,
      // A snapshot's own size is the whole tree; what it adds on disk is `storedBytes`.
      bytes: result.backups.reduce(
        (total, backup) =>
          total +
          (backup.mode === 'SNAPSHOT' && backup.storedBytes != null
            ? backup.storedBytes
            : backup.sizeBytes),
        0,
      ),
    });
  }

  export function show(newServer) {
    modal = new window.bootstrap.Modal(get(modalElement));

    loading.set(false);
    server.set(newServer);
    passwordError.set(false);
    currentPassword.set('');
    managed.set(isManaged(newServer));
    inPlace.set(isInPlace(newServer));
    agent.set(isAgentServer(newServer));

    if (isManaged(newServer)) {
      void readBackups(newServer);
    }

    modal.show();

    setTimeout(() => {
      get(passwordInput).focus();
    }, 500);
  }

  export function hide() {
    hideCallback();

    modal.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { goto } from '$app/navigation';

  import ApiUtil from '$lib/api.util';
  import { formatBytes } from '$lib/string.util.js';

  import {
    showSuccess as showSuccessToast,
    showError as showErrorToast,
  } from '$lib/components/ToastContainer.svelte';

  $: confirmButtonDisabled = $currentPassword.length === 0;

  function sendDeleteServer() {
    $loading = true;

    ApiUtil.post({
      path: `/api/panel/servers/${$server.id}/delete`,
      body: { currentPassword: $currentPassword },
      handler: async (body) => {
        if (body.error) {
          if (body.error === 'CURRENT_PASSWORD_NOT_CORRECT') {
            $passwordError = true;
            $loading = false;
            return;
          }

          $loading = false;
          await showErrorToast('components.toasts.settings-save-error', { errorCode: body.error });
          return;
        }

        callback($server);
        hide();
        await showSuccessToast('components.toasts.server-deleted-success', { name: $server.name });
        await goto(base + '/', { replaceState: true, invalidateAll: true });
        $loading = false;
      },
    });
  }
</script>
