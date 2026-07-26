<!--
  Marks a resource as freemium: free to install, with optional paid features behind a purchased
  tier. Deliberately not a filled badge — freemium is information, not a warning, so it sits
  quietly next to the verified check and the DRM license status.
-->
<span
  class="badge border border-success text-success bg-body rounded-pill"
  use:tooltip={[$_('components.freemium.description'), { placement: 'bottom' }]}>
  {$_('components.freemium.label')}
</span>

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
</script>
