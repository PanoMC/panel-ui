<div class="toast-container position-fixed bottom-0 start-50 translate-middle-x mb-3">
  {#each $toasts as toast, index (toast)}
    <svelte:component this={toast.component} id={toast.id} {...toast.params} />
  {/each}
</div>

<script context="module">
  import { tick } from 'svelte';
  import { writable } from 'svelte/store';

  import DefaultToast from '$lib/component/DefaultToast.svelte';

  const toasts = writable([]);
  let id = 0;

  Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);

    return this;
  };

  Array.prototype.remove = function (index) {
    this.splice(index, 1);

    return this;
  };

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  export async function show(text, params = {}, toastComponent = DefaultToast) {
    while (!window.bootstrap) {
      await delay(50);
    }

    if (text) {
      params.text = text;
    }

    if (toastComponent === DefaultToast) {
      params = { text, values: params };
    }

    const toast = { component: toastComponent, params };

    id = id + 1;

    toast.id = id;

    toasts.update((toasts) => {
      toasts.push(toast);

      return toasts;
    });

    await tick();

    const toastElement = document.getElementById('appToast' + id);

    if (toastElement) {
      const toast = new window.bootstrap.Toast(toastElement);

      toast.show();

      toastElement.addEventListener('hidden.bs.toast', () => {
        toasts.update((toasts) => {
          const foundToast = toasts.find((toast) => toast.id === id);

          toasts.remove(toasts.indexOf(foundToast));

          return toasts;
        });
      });
    }
  }

  export function limitTitle(text) {
    const limit = 32;

    if (text.length > limit) {
      text = text.substring(0, limit) + '...';
    }

    return text;
  }
</script>
