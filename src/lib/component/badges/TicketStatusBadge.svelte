{#if status === TicketStatuses.NEW}
  <a href="{base}/tickets?pageType=WAITING_REPLY"
    ><span class="badge rounded-pill text-bg-success" title="{$_('components.ticket-status-badge.filter')}"
      >{$_('components.ticket-status-badge.new')}</span
    ></a>
{:else if status === TicketStatuses.REPLIED}
  <a href="{base}/tickets"
    ><span class="badge rounded-pill text-bg-warning" title="{$_('components.ticket-status-badge.filter')}"
      >{$_('components.ticket-status-badge.replied')}</span
    ></a>
{:else if status === TicketStatuses.CLOSED}
  <a href="{base}/tickets?pageType=CLOSED"
    ><span class="badge rounded-pill text-bg-danger" title="{$_('components.ticket-status-badge.filter')}"
      >{$_('components.ticket-status-badge.closed')}</span
    ></a>
{/if}

<script context="module">
  export const TicketStatuses = Object.freeze({
    NEW: "NEW",
    REPLIED: "REPLIED",
    CLOSED: "CLOSED",
  });
</script>

<script>
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  export let status = TicketStatuses.NEW;
</script>
