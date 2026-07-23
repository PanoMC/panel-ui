<style>
  .register-agreement-editor-wrap {
    min-width: 0;
    max-width: 100%;
    overflow: auto;
    max-height: min(55vh, 520px);
  }

  :global(.register-agreement-editor-wrap .ProseMirror) {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  :global(.register-agreement-editor-wrap .input-group) {
    max-width: 100%;
  }
</style>

<div
  aria-hidden="true"
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_('pages.settings.site-settings.inputs.register-agreement.label')}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <div class="modal-body">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="requireRegisterAgreement"
            checked={!$agreementOff}
            on:change={onRequireAgreementChange} />
          <label class="form-check-label" for="requireRegisterAgreement">
            {$_('pages.settings.site-settings.inputs.register-agreement.require-label')}
          </label>
        </div>

        {#if !$agreementOff}
          <div class="register-agreement-editor-wrap mt-3">
            {#key $editorKey}
              <Editor
                bind:content={$draft}
                showHtml={true}
                showPreview={true}
                contentStyles="min-height: 240px; height: 360px;" />
            {/key}
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary w-100" type="button" on:click={apply}>
          {$_('buttons.save')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  import { normalizeRegisterAgreement } from '$lib/register-agreement.util.js';

  const modalElement = writable();
  const draft = writable('');
  const editorKey = writable(0);
  /** True when no agreement should be required at registration. */
  const agreementOff = writable(false);

  let modal;
  /** @type {(html: string) => void} */
  let onApply = () => {};

  export function show(currentHtml, applyCallback) {
    onApply = typeof applyCallback === 'function' ? applyCallback : () => {};

    const raw = currentHtml == null ? '' : String(currentHtml);
    const normalized = normalizeRegisterAgreement(raw);
    const off = !normalized;

    agreementOff.set(off);
    draft.set(off ? '' : raw);
    editorKey.update((k) => k + 1);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: true,
    });
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  function onRequireAgreementChange(event) {
    agreementOff.set(!event.currentTarget.checked);
    draft.set('');
    editorKey.update((k) => k + 1);
  }

  function apply() {
    if (get(agreementOff)) {
      onApply('');
    } else {
      onApply(normalizeRegisterAgreement(get(draft)));
    }
    hide();
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import Editor from '$lib/components/Editor.svelte';
</script>
