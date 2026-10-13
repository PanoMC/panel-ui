<!-- Asked before an upload that would replace files: overwrite them, upload only what is new, or
     leave it. One question for the whole drop, not one per file. -->
<div
  class="modal fade"
  tabindex="-1"
  role="dialog"
  aria-hidden="true"
  bind:this={$modalElement}
  on:hidden.bs.modal={() => answer('cancel')}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fa-solid fa-copy fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">
          {$_('components.modals.server-upload-conflict.title', {
            values: { count: $names.length },
          })}
        </h5>
        <div class="text-body-secondary">
          {$_('components.modals.server-upload-conflict.description')}
        </div>
        <div class="text-start mt-3">
          <ul class="list-unstyled font-monospace small mb-2">
            {#each $names.slice(0, SHOWN) as name (name)}
              <li class="text-break">{name}</li>
            {/each}
          </ul>
          {#if $names.length > SHOWN}
            <div class="small text-body-secondary mb-2">
              {$_('pages.servers.files.uploads-more', {
                values: { count: $names.length - SHOWN },
              })}
            </div>
          {/if}
          <button type="button" class="btn btn-link btn-sm p-0" on:click={() => choose('skip')}>
            {$_('components.modals.server-upload-conflict.skip')}
          </button>
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link text-decoration-none col-6 m-0"
          type="button"
          on:click={() => choose('cancel')}>
          {$_('buttons.cancel')}
        </button>
        <button class="btn btn-danger col-6 m-0" type="button" on:click={() => choose('overwrite')}>
          {$_('components.modals.server-upload-conflict.overwrite')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  /** How many of the names are listed; the rest is counted. */
  const SHOWN = 6;

  const modalElement = writable();
  const names = writable([]);

  /** @type {(choice: 'overwrite' | 'skip' | 'cancel') => void} */
  let resolveChoice = () => {};
  let modal;

  function answer(choice) {
    const resolve = resolveChoice;

    resolveChoice = () => {};
    resolve(choice);
  }

  /**
   * @param {string[]} existing the paths that are already there.
   * @returns {Promise<'overwrite' | 'skip' | 'cancel'>} what to do with them.
   */
  export function ask(existing) {
    names.set(existing);

    return new Promise((resolve) => {
      resolveChoice = resolve;

      modal = window.bootstrap.Modal.getOrCreateInstance(get(modalElement));
      modal.show();
    });
  }

  function choose(choice) {
    answer(choice);
    modal?.hide();
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
</script>
