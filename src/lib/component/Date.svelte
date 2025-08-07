<span
  use:useTooltip="{tooltip && [
    format(parseAnyDate(date), 'dd/MM/yyyy, HH:mm'),
    { placement: 'bottom', locale: locales[$currentLanguage.dateFnsCode] },
  ]}">
  <slot>
    {#if relativeFormat}
      {formatRelative(parseAnyDate(date), new Date(), {
        locale: locales[$currentLanguage.dateFnsCode]
      }).capitalize()}
    {:else if fullFormat}
      {format(parseAnyDate(date), 'dd/MM/yyyy, HH:mm', {
        locale: locales[$currentLanguage.dateFnsCode]
      })}
    {:else}
      {format(parseAnyDate(date), "dd MMMM yyyy", {
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

  import { parseISO } from 'date-fns'

  /**
   * Converts a value to a JavaScript Date object, handling:
   * - Unix timestamps in milliseconds (number or numeric string)
   * - ISO 8601 strings
   *
   * @param {string|number} input - The date input (timestamp or ISO string)
   * @returns {Date|null} - A valid Date object or null if invalid
   */
  function parseAnyDate(input) {
    if (typeof input === "number") {
      // Directly from System.currentTimeMillis()
      return new Date(input)
    }

    if (typeof input === "string") {
      // Check if it's a numeric string (timestamp)
      if (/^\d+$/.test(input)) {
        return new Date(parseInt(input, 10))
      }

      // Otherwise assume it's an ISO 8601 string
      return parseISO(input)
    }

    // Unsupported type
    return null
  }
</script>

