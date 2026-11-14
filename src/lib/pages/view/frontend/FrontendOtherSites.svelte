<FrontendOriginsModal bind:this={editor} {controller} />

<script>
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import ApiUtil from '$lib/api.util';

  import FrontendOriginsModal from './FrontendOriginsModal.svelte';
  import { createFrontendApi } from './frontend.api.js';
  import { createOriginsController } from './origins.controller.js';

  /**
   * The separate Other Site Access editor opened from the Themes page.
   * @type {{ api?: any, notify?: any, confirm?: any }}
   */
  let {
    api = createFrontendApi(ApiUtil),
    notify = {
      success: (key, values) => showSuccess(key, values),
      error: (key, values) => showError(key, values),
    },
    confirm = showConfirm,
  } = $props();

  const controller = createOriginsController({
    api,
    notify,
    confirm,
    initial: {},
  });

  let editor = $state();
  let loading = false;

  export async function show() {
    if (loading) return;

    loading = true;

    try {
      if (await controller.refresh()) editor?.show();
    } finally {
      loading = false;
    }
  }
</script>
