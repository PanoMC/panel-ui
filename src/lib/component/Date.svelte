<span
  use:useTooltip="{tooltip && [
    format(new Date(parseInt(date)), 'dd/MM/yyyy, HH:mm'),
    { placement: 'bottom', locale: locales[$currentLanguage.dateFnsCode] },
  ]}">
  <slot>
    {#if relativeFormat}
      {formatRelative(new Date(parseInt(date)), new Date(), {
        locale: locales[$currentLanguage.dateFnsCode]
      }).capitalize()}
    {:else if fullFormat}
      {format(new Date(parseInt(date)), 'dd/MM/yyyy, HH:mm', {
        locale: locales[$currentLanguage.dateFnsCode]
      })}
    {:else}
      {format(new Date(parseInt(date)), "dd MMMM yyyy", {
        locale: locales[$currentLanguage.dateFnsCode]
      })}
    {/if}
  </slot>
</span>

<script>
  import { format, formatRelative } from "date-fns";
  import * as locales from "date-fns/locale";

  import useTooltip from "$lib/tooltip.util";
  import { currentLanguage } from "$lib/language.util.js";

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  export let time;
  export let relativeFormat = false;
  export let fullFormat = false;
  export let tooltip = true;

  $: date = time;
</script>

