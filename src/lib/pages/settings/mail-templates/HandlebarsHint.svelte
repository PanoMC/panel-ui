<!-- Every mail text is a Handlebars template (Handlebars.java, built-in helpers only). -->
<div class="form-text mt-0">
  {$_('pages.mail-templates.handlebars.intro')}
  <code>{'{{name}}'}</code>
  {$_('pages.mail-templates.handlebars.variable')},
  <code>{'{{{name}}}'}</code>
  {$_('pages.mail-templates.handlebars.html')},
  <code>{'{{#if name}}…{{/if}}'}</code>,
  <code>{'{{#each list}}…{{/each}}'}</code>.
  {$_('pages.mail-templates.handlebars.helpers')}
  <a href="https://handlebarsjs.com/guide/" target="_blank" rel="noopener noreferrer">
    {$_('pages.mail-templates.handlebars.guide')}
    <i class="fa-solid fa-arrow-up-right-from-square ms-1" aria-hidden="true"></i>
  </a>
</div>

<script>
  import { _ } from 'svelte-i18n';
</script>
