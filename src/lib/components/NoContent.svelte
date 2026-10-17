<div class="card border-0 opacity-25 bg-transparent">
  <div class="card-body vstack gap-3 text-center">
    <span class={icon}></span>
    {#if text}
      <p class="mb-0">{text}</p>
    {/if}
  </div>
</div>

<slot />

<script>
  export let icon = 'fa-regular fa-square fa-3x';
  export let text = '';
</script>
