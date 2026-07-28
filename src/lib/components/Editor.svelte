<style>
  /* Mobile */
  .editor-height {
    min-height: auto;
    height: 100%;
  }

  /* md and above (tablet + desktop) */
  @media (min-width: 768px) {
    .editor-height {
      min-height: 100%;
      height: 100%;
    }
  }

  :global(.ProseMirror) {
    min-height: 100%;
    height: 100%;
    outline: none;
  }
</style>

{#if editor}
  <div class="d-flex align-items-center justify-content-between mb-2">
    <div class="d-flex flex-wrap">
      {#if !isHtmlView}
        <!-- Headings -->
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          class:border-primary={editor.isActive('heading', { level: 1 })}
          class:text-primary={editor.isActive('heading', { level: 1 })}
          title={$_('components.editor.title', { values: { number: 1 } })}
          aria-label={$_('components.editor.title', { values: { number: 1 } })}>
          H1
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          class:border-primary={editor.isActive('heading', { level: 2 })}
          class:text-primary={editor.isActive('heading', { level: 2 })}
          title={$_('components.editor.title', { values: { number: 2 } })}
          aria-label={$_('components.editor.title', { values: { number: 2 } })}>
          H2
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          class:border-primary={editor.isActive('heading', { level: 3 })}
          class:text-primary={editor.isActive('heading', { level: 3 })}
          title={$_('components.editor.title', { values: { number: 3 } })}
          aria-label={$_('components.editor.title', { values: { number: 3 } })}>
          H3
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          class:border-primary={editor.isActive('heading', { level: 4 })}
          class:text-primary={editor.isActive('heading', { level: 4 })}
          title={$_('components.editor.title', { values: { number: 4 } })}
          aria-label={$_('components.editor.title', { values: { number: 4 } })}>
          H4
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          class:border-primary={editor.isActive('heading', { level: 5 })}
          class:text-primary={editor.isActive('heading', { level: 5 })}
          title={$_('components.editor.title', { values: { number: 5 } })}
          aria-label={$_('components.editor.title', { values: { number: 5 } })}>
          H5
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          class:border-primary={editor.isActive('heading', { level: 6 })}
          class:text-primary={editor.isActive('heading', { level: 6 })}
          title={$_('components.editor.title', { values: { number: 6 } })}
          aria-label={$_('components.editor.title', { values: { number: 6 } })}>
          H6
        </button>

        <!-- Text Formatting -->
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleBold().run()}
          class:border-primary={editor.isActive('bold')}
          class:text-primary={editor.isActive('bold')}
          title={$_('components.editor.bold')}
          aria-label={$_('components.editor.bold')}>
          <b>B</b>
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleItalic().run()}
          class:border-primary={editor.isActive('italic')}
          class:text-primary={editor.isActive('italic')}
          title={$_('components.editor.italic')}
          aria-label={$_('components.editor.italic')}>
          <i>I</i>
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleUnderline().run()}
          class:border-primary={editor.isActive('underline')}
          class:text-primary={editor.isActive('underline')}
          title={$_('components.editor.underline')}
          aria-label={$_('components.editor.underline')}>
          <u>U</u>
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleStrike().run()}
          class:border-primary={editor.isActive('strike')}
          class:text-primary={editor.isActive('strike')}
          title={$_('components.editor.strike')}
          aria-label={$_('components.editor.strike')}>
          <s>S</s>
        </button>

        <!-- Lists -->
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleBulletList().run()}
          class:border-primary={editor.isActive('bulletList')}
          class:text-primary={editor.isActive('bulletList')}
          title={$_('components.editor.bullet-list')}
          aria-label={$_('components.editor.bullet-list')}>
          <i class="fas fa-list"></i>
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().toggleOrderedList().run()}
          class:border-primary={editor.isActive('orderedList')}
          class:text-primary={editor.isActive('orderedList')}
          title={$_('components.editor.ordered-list')}
          aria-label={$_('components.editor.ordered-list')}>
          <i class="fas fa-list-ol"></i>
        </button>

        <!-- Media -->
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={addImage}
          title={$_('components.editor.image')}
          aria-label={$_('components.editor.image')}>
          <i class="fas fa-image"></i>
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={setLink}
          title={$_('components.editor.link')}
          aria-label={$_('components.editor.link')}
          class:border-primary={editor.isActive('link')}
          class:text-primary={editor.isActive('link')}>
          <i class="fas fa-link"></i>
        </button>
        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={openColorPicker}
          title={$_('components.editor.text-color')}
          aria-label={$_('components.editor.text-color')}>
          <i
            class="fas fa-tint"
            style={editor.getAttributes('textStyle').color &&
              'color:' + editor.getAttributes('textStyle').color + ';'}></i>
        </button>

        <input
          type="color"
          bind:this={colorPickerElement}
          value={editor.getAttributes('textStyle').color}
          oninput={(event) => editor.chain().focus().setColor(event.target.value).run()}
          hidden />

        <button
          class="btn btn-link btn-sm text-decoration-none"
          onclick={() => editor.chain().focus().unsetColor().run()}
          title={$_('components.editor.remove-text-color')}
          aria-label={$_('components.editor.remove-text-color')}>
          <i class="fas fa-tint-slash"></i>
        </button>
      {/if}
    </div>

    {#if showHtml}
      <div class="d-flex gap-2">
        {#if showPreview}
          <button
            class="btn btn-link btn-sm"
            class:text-primary={isPreview}
            onclick={() => (isPreview = !isPreview)}>
            <i class="fas fa-eye"></i>
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        {/if}

        {#if showHtml}
          <button
            class="btn btn-link btn-sm"
            class:text-primary={isHtmlView}
            onclick={() => (isHtmlView = !isHtmlView)}>
            <i class="fas fa-code"></i>
            {isHtmlView ? 'Rich Text' : 'HTML'}
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<!-- Editor Content -->
<div class="input-group flex-grow-1">
  <div
    class="form-control editor-height"
    style={contentStyles}
    class:d-none={isHtmlView || isPreview}
    bind:this={element}>
  </div>

  {#if isHtmlView}
    <textarea
      class="form-control editor-height"
      style={contentStyles}
      bind:value={content}
      oninput={() => (isEmpty = content.trim().length === 0)}></textarea>
  {/if}

  {#if isPreview}
    <div class="form-control editor-height overflow-auto" style={contentStyles}>
      {#if previewContent}
        {@render previewContent()}
      {:else}
        {@html content}
      {/if}
    </div>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</div>

<script>
  import { onMount, onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Image from '@tiptap/extension-image';
  import { TextStyleKit } from '@tiptap/extension-text-style';

  let element = $state();
  let colorPickerElement = $state();
  let editorContent = $state('');
  let isHtmlView = $state(false);

  let {
    content = $bindable(),
    isEmpty = $bindable(true),
    showHtml = false,
    showPreview = false,
    /** Bindable so a caller can open straight into the preview and react to the toggle. */
    isPreview = $bindable(false),
    html = false,
    contentStyles = '',
    /** Rendered instead of the content HTML while previewing, for a richer preview. */
    previewContent,
    children,
  } = $props();

  let editor = new Editor({
    element: undefined,
    // Seeded from the incoming value, not from an empty document: `onCreate` writes `getHTML()`
    // straight back into `content`, so starting empty overwrote whatever the caller passed in
    // before the effect below ever had a chance to restore it.
    content: content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    extensions: [
      StarterKit,
      Image,
      TextStyleKit.configure({
        backgroundColor: {
          types: ['textStyle'],
        },
        color: {
          types: ['textStyle'],
        },
        fontFamily: {
          types: ['textStyle'],
        },
        fontSize: {
          types: ['textStyle'],
        },
        lineHeight: {
          types: ['textStyle'],
        },
      }),
    ],
    onTransaction: () => {
      // force re-render so `editor.isActive` works as expected
      editor = editor;
    },
    onUpdate: ({ editor }) => {
      content = editor.getHTML();
      editorContent = editor.getHTML();
      isEmpty = editor.isEmpty;
    },
    onCreate: ({ editor }) => {
      content = editor.getHTML();
      editorContent = editor.getHTML();
      isEmpty = editor.isEmpty;
    },
  });

  $effect(() => {
    // isHtmlView = html;
    if (!isHtmlView && editorContent !== content) {
      editor?.commands.setContent(content);
    }
  });

  function openColorPicker() {
    colorPickerElement.click();
  }

  function addImage() {
    const url = window.prompt('URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  function setLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();

      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  onMount(() => {
    editor?.mount(element);
  });

  onDestroy(() => {
    // if (editor) {
    //   editor.destroy();
    // }
  });
</script>
