<Toast id="{id}">{$_('components.toasts.smtp-disabled-success')}</Toast>

<script>
  import { _ } from "svelte-i18n";

  import Toast from "$lib/component/Toast.svelte";

  export let id;
</script>
