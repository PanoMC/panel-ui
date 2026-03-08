<style>
  .craftweb-tribute {
    text-align: center;
    padding: 2rem 1rem;
  }

  .craftweb-tribute .tribute-icon {
    font-size: 3rem;
    color: var(--bs-warning);
    margin-bottom: 1rem;
  }

  .craftweb-tribute .tribute-text {
    font-size: 1.1rem;
    color: var(--bs-secondary-color);
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.7;
  }
</style>

<div class="craftweb-tribute">
  <div class="tribute-icon">
    <i class="fas fa-heart"></i>
  </div>
  <p class="tribute-text">
    {$_('pages.migration.craftweb-tribute')}
  </p>
</div>

<script>
  import { _ } from 'svelte-i18n';
</script>
