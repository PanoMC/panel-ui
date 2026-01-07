<Toast {id}>{@html $_(text, { values })}</Toast>

<script>
  import { _ } from 'svelte-i18n';

  import Toast from '$lib/component/Toast.svelte';

  export let id;
  export let text;
  export let values;
</script>
