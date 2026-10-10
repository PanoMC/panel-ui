<style>
  /* The release notes: small headings, and every change is a list-group item. */
  .changelog :global(h1),
  .changelog :global(h2),
  .changelog :global(h3),
  .changelog :global(h4),
  .changelog :global(h5),
  .changelog :global(h6) {
    font-size: 1rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem;
  }

  .changelog :global(h1) {
    font-size: 1.125rem;
    margin-top: 0;
  }

  .changelog :global(h1:not(:first-child)) {
    margin-top: 1.5rem;
  }

  .changelog :global(.markdown-renderer > ul) {
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
    border: var(--bs-border-width) solid var(--bs-border-color);
    border-radius: var(--bs-border-radius);
    overflow: hidden;
  }

  .changelog :global(.markdown-renderer > ul > li) {
    padding: 0.5rem 1rem;
    background-color: var(--bs-body-bg);
    color: var(--bs-body-color);
  }

  .changelog :global(.markdown-renderer > ul > li + li) {
    border-top: var(--bs-border-width) solid var(--bs-border-color);
  }

  .changelog :global(.markdown-renderer > ul ul) {
    margin: 0.25rem 0 0;
    padding-left: 1.25rem;
  }
</style>

<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog">
  <div class="modal-dialog modal-dialog-centered modal-lg" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('pages.settings.updates.changelog')}</h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>
      <div class="modal-body changelog">
        <!-- One accordion item per release; the newest (first) one is open. -->
        <div class="accordion" id="changelogAccordion">
          {#each versions as version, index (`${showCount}-${index}`)}
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button
                  class="accordion-button"
                  class:collapsed={index !== 0}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#changelogVersion{index}"
                  aria-expanded={index === 0}
                  aria-controls="changelogVersion{index}">
                  {version.title || $_('pages.settings.updates.changelog')}
                </button>
              </h2>
              <div
                id="changelogVersion{index}"
                class="accordion-collapse collapse"
                class:show={index === 0}>
                <div class="accordion-body">
                  <div class="markdown-renderer">
                    <MarkdownRenderer content={version.body} />
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();

  let modal;
  const changelogContent = writable('');
  /** Bumped per `show()`, so the accordion starts over (newest release open) every time. */
  const changelogShowCount = writable(0);

  /**
   * Splits release notes into one entry per release: a release starts at a `#` or `##` heading
   * (the `###` ones are its sections). Notes without such a heading stay one entry.
   *
   * @param {unknown} content
   * @returns {{ title: string, body: string }[]}
   */
  function splitReleases(content) {
    const text = typeof content === 'string' ? content : '';
    const releases = [];
    let preamble = [];

    for (const line of text.split('\n')) {
      const heading = /^#{1,2}\s+(.*)$/.exec(line);

      if (heading) {
        // `[1.0.0](link) (date)` reads as `1.0.0 (date)`: a link cannot sit inside the button.
        const title = heading[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();

        releases.push({ title, lines: [] });
      } else if (releases.length === 0) {
        preamble.push(line);
      } else {
        releases[releases.length - 1].lines.push(line);
      }
    }

    if (releases.length === 0) {
      return [{ title: '', body: text }];
    }

    const lead = preamble.join('\n').trim();

    return releases.map((release, index) => ({
      title: release.title,
      body: (index === 0 && lead ? `${lead}\n\n` : '') + release.lines.join('\n').trim(),
    }));
  }

  export function show(content) {
    changelogContent.set(content);
    changelogShowCount.update((count) => count + 1);

    modal = new window.bootstrap.Modal(get(modalElement));

    modal.show();
  }

  export function hide() {
    modal.hide();
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

  $: versions = splitReleases($changelogContent);
  $: showCount = $changelogShowCount;
</script>
