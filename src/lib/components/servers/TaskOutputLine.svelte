<style>
  /*
   * Both are as wide as their column and never wider: a long Maven line must not count toward the
   * column's own width, or it would push the header block below the server icon.
   */
  .task-output-line,
  .task-output-panel {
    width: 0;
    min-width: 100%;
  }

  .task-output-line {
    font-size: 0.875em;
  }

  .task-output-line:hover,
  .task-output-line:focus-visible {
    color: var(--bs-body-color) !important;
  }

  .task-output-chevron {
    transition: transform 0.2s ease;
  }

  .task-output-chevron.open {
    transform: rotate(90deg);
  }

  .task-output {
    max-height: 16rem;
    overflow: auto;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-all;
    background-color: var(--bs-tertiary-bg);
    border: 1px solid var(--bs-border-color-translucent);
    border-radius: var(--bs-border-radius);
  }
</style>

<!-- A long task's latest output line, which is also the switch that opens every line that came in
     while the page was open (BuildTools prints minutes of Maven output). The server header and the
     software dialog show the same one. -->
{#if line}
  <button
    type="button"
    class="task-output-line btn btn-link p-0 border-0 small font-monospace text-body-secondary text-start text-decoration-none d-flex align-items-center gap-1 {className}"
    aria-expanded={open}
    aria-controls={panelId}
    use:tooltip={[
      $_(open ? 'pages.servers.header.task-log-hide' : 'pages.servers.header.task-log-show'),
      { appendTo: () => document.body, placement: 'bottom' },
    ]}
    onclick={() => (open = !open)}>
    <i class="fa-solid fa-chevron-right fa-fw task-output-chevron" class:open aria-hidden="true"
    ></i>
    <span class="text-truncate">{line}</span>
  </button>
{/if}
{#if open}
  <div class="task-output-panel mt-2" id={panelId}>
    <pre class="task-output small mb-1" bind:this={output} onscroll={onScroll}>{text}</pre>
    <div class="small text-body-secondary">
      {$_('pages.servers.header.task-log-hint')}
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import tooltip from '$lib/tooltip.util';

  /**
   * @type {{ line?: string, lines?: string[], class?: string }}
   * @property line the newest line; nothing is drawn without one, but an open log stays open.
   * @property lines every line collected so far, oldest first.
   */
  let { line = '', lines = [], class: className = '' } = $props();

  // The same on the server and in the browser, so hydration keeps the pair.
  const uid = $props.id();
  const panelId = `taskOutput-${uid}`;

  let open = $state(false);
  /** @type {HTMLPreElement | undefined} */
  let output = $state();
  /** Whether the reader is at the newest line; scrolling up to read an older one stops following. */
  let atEnd = true;

  const text = $derived((Array.isArray(lines) ? lines : []).join('\n'));

  // Effects run after the DOM is updated, so the new lines are already in the element here.
  $effect(() => {
    void text;

    const element = output;

    if (open && element && atEnd) {
      element.scrollTop = element.scrollHeight;
    }
  });

  // A closed log opens on its newest line.
  $effect(() => {
    if (!open) {
      atEnd = true;
    }
  });

  function onScroll() {
    const element = output;

    if (element) {
      atEnd = element.scrollHeight - element.scrollTop - element.clientHeight < 8;
    }
  }
</script>
