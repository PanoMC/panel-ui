<div
  aria-hidden="true"
  class="modal fade"
  bind:this={$modalElement}
  role="dialog">
  <div class="modal-dialog modal-dialog-centered modal-lg" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_("pages.settings.updates.changelog")}</h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_("buttons.close")}
          title={$_("buttons.close")}
          onclick={hide}></button>
      </div>
      <div class="modal-body">
        <div class="markdown-renderer">
          <MarkdownRenderer content={$changelogContent} />
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from "svelte/store";

  const modalElement = writable();

  let modal;
  const changelogContent = writable("");

  export function show(content) {
    changelogContent.set(content);

    modal = new window.bootstrap.Modal(get(modalElement));

    modal.show();
  }

  export function hide() {
    modal.hide();
  }
</script>

<script>
  import { _ } from "svelte-i18n";
  import MarkdownRenderer from "$lib/component/MarkdownRenderer.svelte";
</script>
