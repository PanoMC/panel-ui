<style>
  .software-logo {
    width: var(--software-logo-size, 2.25rem);
    height: var(--software-logo-size, 2.25rem);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--bs-border-radius);
    flex-shrink: 0;
    overflow: hidden;
    padding: 0.2em;
  }

  .software-logo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
</style>

<!--
  The brand mark of a server software, in the same fixed-size rounded chip the create wizards
  use for their other choices (`choice-icon`).

  It is decorative: every caller renders the software's name right beside it, so the image is
  `alt=""` and the fallback icon is `aria-hidden`. When the software has no bundled logo, or the
  file fails to load, the chip falls back to that software's Font Awesome icon.

  The chip keeps a neutral `bg-body-secondary` background rather than a hardcoded white so the
  dark-on-transparent marks (Fabric, Quilt) stay legible in both themes.
-->
<span class="software-logo bg-body-secondary text-body-secondary" style={sizeStyle}>
  {#if logo && !failed}
    <img src={logo} alt="" aria-hidden="true" onerror={() => (failedLogo = logo)} />
  {:else}
    <i class={softwareIcon(id)} aria-hidden="true"></i>
  {/if}
</span>

<script>
  import { softwareIcon, softwareLogo } from '$lib/software.util.js';

  /**
   * @type {{ id?: string | null, size?: string }}
   * @property id The software id, in either case (`paper` or `PAPER`).
   * @property size Any CSS length; the chip is square and the mark is contained inside it.
   */
  let { id = '', size = '2.25rem' } = $props();

  const logo = $derived(softwareLogo(id));
  const sizeStyle = $derived(`--software-logo-size: ${size}`);

  // Keyed on the URL rather than a plain boolean, so a broken file does not stick to the
  // next software the chip is asked to render.
  let failedLogo = $state('');
  const failed = $derived(!!logo && failedLogo === logo);
</script>
