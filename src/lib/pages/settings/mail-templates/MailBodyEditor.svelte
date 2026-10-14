<style>
  .mail-body-editor :global(.ProseMirror) {
    min-height: 240px;
    outline: none;
  }

  .mail-body-editor :global(.ProseMirror p) {
    margin-bottom: 0.75rem;
  }
</style>

<!-- The visual editor of a mail body: TipTap with the formatting a mail needs. Unlike the post
     editor it reports only the admin's own edits (`onchange`), so loading a body that TipTap
     normalizes does not count as an unsaved change, and it can insert a variable at the caret. -->
<div class="mail-body-editor">
  {#if editor}
    <div class="d-flex flex-wrap mb-2" role="toolbar">
      {#each marks as mark, index (index)}
        <button
          type="button"
          class="btn btn-link btn-sm text-decoration-none"
          class:text-primary={isActive(mark)}
          title={$_(mark.label, { values: mark.values })}
          aria-label={$_(mark.label, { values: mark.values })}
          aria-pressed={isActive(mark)}
          onclick={mark.run}>
          {#if mark.icon}
            <i class={mark.icon} aria-hidden="true"></i>
          {:else}
            {mark.text}
          {/if}
        </button>
      {/each}
    </div>
  {/if}
  <div
    class="form-control"
    class:is-invalid={invalid}
    bind:this={element}
    onfocusin={() => onfocus?.()}>
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';

  let { value = '', invalid = false, onchange, onfocus } = $props();

  /** @type {HTMLDivElement} */
  let element;
  /** @type {Editor | null} */
  let editor = $state.raw(null);

  const chain = () => editor.chain().focus();

  const marks = [
    {
      name: 'bold',
      label: 'components.editor.bold',
      text: 'B',
      run: () => chain().toggleBold().run(),
    },
    {
      name: 'italic',
      label: 'components.editor.italic',
      icon: 'fas fa-italic',
      run: () => chain().toggleItalic().run(),
    },
    {
      name: 'underline',
      label: 'components.editor.underline',
      icon: 'fas fa-underline',
      run: () => chain().toggleUnderline().run(),
    },
    {
      name: 'strike',
      label: 'components.editor.strike',
      icon: 'fas fa-strikethrough',
      run: () => chain().toggleStrike().run(),
    },
    {
      name: 'heading',
      attributes: { level: 2 },
      label: 'components.editor.title',
      values: { number: 2 },
      text: 'H2',
      run: () => chain().toggleHeading({ level: 2 }).run(),
    },
    {
      name: 'heading',
      attributes: { level: 3 },
      label: 'components.editor.title',
      values: { number: 3 },
      text: 'H3',
      run: () => chain().toggleHeading({ level: 3 }).run(),
    },
    {
      name: 'bulletList',
      label: 'components.editor.bullet-list',
      icon: 'fas fa-list',
      run: () => chain().toggleBulletList().run(),
    },
    {
      name: 'orderedList',
      label: 'components.editor.ordered-list',
      icon: 'fas fa-list-ol',
      run: () => chain().toggleOrderedList().run(),
    },
    { name: 'link', label: 'components.editor.link', icon: 'fas fa-link', run: setLink },
  ];

  /** Bumped on every transaction so the toolbar re-reads the active marks. */
  let version = $state(0);

  /** @param {{ name: string, attributes?: Record<string, any> }} mark */
  function isActive(mark) {
    version;

    return !!editor?.isActive(mark.name, mark.attributes);
  }

  function setLink() {
    const url = window.prompt('URL', editor.getAttributes('link').href ?? '');

    if (url === null) return;

    if (url === '') {
      chain().extendMarkRange('link').unsetLink().run();

      return;
    }

    chain().extendMarkRange('link').setLink({ href: url }).run();
  }

  /**
   * Puts `text` at the caret (replacing the selection) as plain text.
   *
   * @param {string} text
   */
  export function insert(text) {
    editor?.chain().focus().insertContent({ type: 'text', text }).run();
  }

  onMount(() => {
    const created = new Editor({
      element,
      content: value || '',
      extensions: [StarterKit.configure({ link: { openOnClick: false } })],
      onTransaction: () => {
        version += 1;
      },
      onUpdate: ({ editor: current }) => onchange?.(current.getHTML()),
    });

    editor = created;

    return () => {
      created.destroy();
      editor = null;
    };
  });
</script>
