{#if status === TicketStatuses.NEW}
  <a
    class="badge rounded-pill text-bg-success focus-ring text-decoration-none"
    use:tooltip={[$_('components.ticket-status-badge.filter')]}
    href="{base}/tickets?pageType=WAITING_REPLY">{$_('components.ticket-status-badge.new')}</a>
{:else if status === TicketStatuses.REPLIED}
  <a
    class="badge rounded-pill text-bg-warning focus-ring text-decoration-none"
    use:tooltip={[$_('components.ticket-status-badge.filter')]}
    href="{base}/tickets">{$_('components.ticket-status-badge.replied')}</a>
{:else if status === TicketStatuses.CLOSED}
  <a
    class="badge rounded-pill text-bg-danger focus-ring text-decoration-none"
    use:tooltip={[$_('components.ticket-status-badge.filter')]}
    href="{base}/tickets?pageType=CLOSED">{$_('buttons.closed')}</a>
{/if}

<script context="module">
  export const TicketStatuses = Object.freeze({
    NEW: 'NEW',
    REPLIED: 'REPLIED',
    CLOSED: 'CLOSED',
  });
</script>

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import { base } from '$app/paths';

  export let status = TicketStatuses.NEW;
</script>
