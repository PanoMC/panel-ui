<Toast {id} {variant}>{@html $_(text, { values })}</Toast>

<script>
  import { _ } from 'svelte-i18n';

  import Toast from '$lib/components/Toast.svelte';

  export let id;
  export let text;
  export let values;
  export let variant = null;
</script>
