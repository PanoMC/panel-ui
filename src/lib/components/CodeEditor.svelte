<style>
  .code-editor {
    min-height: var(--code-editor-height, 320px);
    height: var(--code-editor-height, 320px);
    overflow: hidden;
    padding: 0;
  }
</style>

<!-- A CodeMirror editor for one value, loaded on demand like the file manager's. The value is read
     once when it mounts: re-create it (`{#key}`) to load another one. -->
<div
  class="form-control code-editor"
  class:is-invalid={invalid}
  style:--code-editor-height={height}
  bind:this={parent}
  onfocusin={() => onfocus?.()}>
  {#if !ready}
    <textarea
      class="form-control border-0 font-monospace h-100 small"
      readonly
      aria-label={label}
      {value}></textarea>
  {/if}
</div>

<script>
  import { onMount } from 'svelte';

  import { createFileEditor, isPanelDark, onPanelThemeChange } from '$lib/codemirror.util.js';
  import { EditorLanguages } from '$lib/files.util.js';

  let {
    value = '',
    language = EditorLanguages.TEXT,
    height = '320px',
    invalid = false,
    label = '',
    onchange,
    onfocus,
  } = $props();

  /** @type {HTMLDivElement} */
  let parent;
  let ready = $state(false);
  /** @type {Awaited<ReturnType<typeof createFileEditor>> | null} */
  let editor = null;

  /**
   * Puts `text` at the caret (replacing the selection).
   *
   * @param {string} text
   */
  export function insert(text) {
    editor?.insert(text);
  }

  export function focus() {
    editor?.focus();
  }

  onMount(() => {
    let destroyed = false;
    let stopThemeWatch = () => {};

    createFileEditor({
      parent,
      doc: value,
      language,
      dark: isPanelDark(),
      onChange: (next) => onchange?.(next),
    }).then((created) => {
      if (destroyed) {
        created.destroy();

        return;
      }

      editor = created;
      ready = true;
      stopThemeWatch = onPanelThemeChange((dark) => editor?.setDark(dark));
    });

    return () => {
      destroyed = true;
      stopThemeWatch();
      editor?.destroy();
      editor = null;
    };
  });
</script>
