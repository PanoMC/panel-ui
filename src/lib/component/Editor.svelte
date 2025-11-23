{#if editor}
  <div>
    <!-- Headings -->
    <button
      class="btn btn-link btn-sm"
      on:click="{() =>
        editor.chain().focus().toggleHeading({ level: 1 }).run()}"
      class:border-primary="{editor.isActive('heading', { level: 1 })}"
      class:text-primary="{editor.isActive('heading', { level: 1 })}"
      use:tooltip="{[
        $_('components.editor.title', { values: { number: 1 } }),
        { placement: 'bottom' },
      ]}">
      H1
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{() =>
        editor.chain().focus().toggleHeading({ level: 2 }).run()}"
      class:border-primary="{editor.isActive('heading', { level: 2 })}"
      class:text-primary="{editor.isActive('heading', { level: 2 })}"
      use:tooltip="{[
        $_('components.editor.title', { values: { number: 2 } }),
        { placement: 'bottom' },
      ]}">
      H2
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{() =>
        editor.chain().focus().toggleHeading({ level: 3 }).run()}"
      class:border-primary="{editor.isActive('heading', { level: 3 })}"
      class:text-primary="{editor.isActive('heading', { level: 3 })}"
      use:tooltip="{[
        $_('components.editor.title', { values: { number: 3 } }),
        { placement: 'bottom' },
      ]}">
      H3
    </button>

    <!-- Text Formatting -->
    <button
      class="btn btn-link btn-sm"
      on:click="{() => editor.chain().focus().toggleBold().run()}"
      class:border-primary="{editor.isActive('bold')}"
      class:text-primary="{editor.isActive('bold')}"
      use:tooltip="{[$_('components.editor.bold'), { placement: 'bottom' }]}">
      <b>B</b>
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{() => editor.chain().focus().toggleItalic().run()}"
      class:border-primary="{editor.isActive('italic')}"
      class:text-primary="{editor.isActive('italic')}"
      use:tooltip="{[$_('components.editor.italic'), { placement: 'bottom' }]}">
      <i>I</i>
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{() => editor.chain().focus().toggleUnderline().run()}"
      class:border-primary="{editor.isActive('underline')}"
      class:text-primary="{editor.isActive('underline')}"
      use:tooltip="{[
        $_('components.editor.underline'),
        { placement: 'bottom' },
      ]}">
      <u>U</u>
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{() => editor.chain().focus().toggleStrike().run()}"
      class:border-primary="{editor.isActive('strike')}"
      class:text-primary="{editor.isActive('strike')}"
      use:tooltip="{[$_('components.editor.strike'), { placement: 'bottom' }]}">
      <s>S</s>
    </button>

    <!-- Lists -->
    <button
      class="btn btn-link btn-sm"
      on:click="{() => editor.chain().focus().toggleBulletList().run()}"
      class:border-primary="{editor.isActive('bulletList')}"
      class:text-primary="{editor.isActive('bulletList')}"
      use:tooltip="{[
        $_('components.editor.bullet-list'),
        { placement: 'bottom' },
      ]}">
      <i class="fas fa-list"></i>
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{() => editor.chain().focus().toggleOrderedList().run()}"
      class:border-primary="{editor.isActive('orderedList')}"
      class:text-primary="{editor.isActive('orderedList')}"
      use:tooltip="{[
        $_('components.editor.ordered-list'),
        { placement: 'bottom' },
      ]}">
      <i class="fas fa-list-ol"></i>
    </button>

    <!-- Media -->
    <button
      class="btn btn-link btn-sm"
      on:click="{addImage}"
      use:tooltip="{[$_('components.editor.image'), { placement: 'bottom' }]}">
      <i class="fas fa-image"></i>
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{setLink}"
      use:tooltip="{[$_('components.editor.link'), { placement: 'bottom' }]}"
      class:border-primary="{editor.isActive('link')}"
      class:text-primary="{editor.isActive('link')}">
      <i class="fas fa-link"></i>
    </button>
    <button
      class="btn btn-link btn-sm"
      on:click="{openColorPicker}"
      use:tooltip="{[
        $_('components.editor.text-color'),
        { placement: 'bottom' },
      ]}">
      <i
        class="fas fa-tint"
        style="{editor.getAttributes('textStyle').color &&
          'color:' + editor.getAttributes('textStyle').color + ';'}"></i>
    </button>

    <input
      type="color"
      bind:this="{colorPickerElement}"
      value="{editor.getAttributes('textStyle').color}"
      on:input="{(event) =>
        editor.chain().focus().setColor(event.target.value).run()}"
      hidden />

    <button
      class="btn btn-link btn-sm"
      on:click="{() => editor.chain().focus().unsetColor().run()}"
      use:tooltip="{[
        $_('components.editor.remove-text-color'),
        { placement: 'bottom' },
      ]}">
      <i class="fas fa-tint-slash"></i>
    </button>
  </div>
{/if}

<!-- Editor Content -->
<div class="form-control h-auto editor-height" bind:this="{element}"></div>

<style>
  /* Mobile */
  .editor-height {
    min-height: auto;
  }

  /* md and above (tablet + desktop) */
  @media (min-width: 768px) {
    .editor-height {
      min-height: 100%;
    }
  }
</style>

<script>
  import { onMount, onDestroy } from "svelte";
  import { _ } from "svelte-i18n";

  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Image from "@tiptap/extension-image";
  import { TextStyleKit } from "@tiptap/extension-text-style";
  import Color from "@tiptap/extension-color";

  import tooltip from "$lib/tooltip.util";

  let element;
  let colorPickerElement;
  let editor;
  let editorContent = "";

  export let content = "";
  export let isEmpty = true;

  $: {
    if (editor && editorContent !== content) {
      editor.commands.setContent(content);
    }
  }

  function openColorPicker() {
    colorPickerElement.click();
  }

  function addImage() {
    const url = window.prompt("URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  function setLink() {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  onMount(() => {
    editor = new Editor({
      element: element,
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
        Color,
      ],
      content: content,
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
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>
