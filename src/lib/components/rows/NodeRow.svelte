<style>
  .status-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  /* L19 — thirteen columns have to fit beside the sidebar at 1440 px, so the usage cells take
     only what the gauge and its figure need ("used /" over "total" when room is short) and the
     name keeps a width of its own instead of being squeezed to a letter per line. */
  .usage-cell {
    vertical-align: middle;
  }

  .name-cell {
    min-width: 7rem;
    max-width: 14rem;
  }
</style>

<tr class:table-active={selected}>
  <th scope="row" class="align-middle text-center">
    <div class="dropdown position-static">
      <button
        type="button"
        class="btn btn-link"
        data-bs-toggle="dropdown"
        title={$_('pages.servers.nodes.column-actions')}
        aria-label={$_('pages.servers.nodes.column-actions')}>
        <span class="fas fa-ellipsis-v"></span>
      </button>
      <div class="dropdown-menu dropdown-menu-start">
        <a class="dropdown-item" href="{base}/servers/nodes/{node.id}" title={$_('buttons.view')}>
          <i class="fas fa-eye me-2"></i>
          {$_('buttons.view')}
        </a>
        <button type="button" class="dropdown-item" on:click={onRename}>
          <i class="fa-solid fa-pen me-2"></i>
          {$_('pages.servers.nodes.rename-action')}
        </button>
        {#if canUpdate}
          <button type="button" class="dropdown-item" disabled={updating} on:click={onUpdate}>
            {#if updating}
              <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            {:else}
              <i class="fa-solid fa-arrow-up-from-bracket me-2"></i>
            {/if}
            {$_('pages.servers.nodes.update-title')}
          </button>
        {/if}
        <button type="button" class="dropdown-item link-danger" on:click={onDelete}>
          <i class="fa-solid fa-trash me-2"></i>
          {$_('buttons.delete')}
        </button>
      </div>
    </div>
  </th>
  <td class="name-cell fw-semibold text-break align-middle">
    <a
      class="text-reset text-decoration-none d-block text-truncate rounded focus-ring"
      href="{base}/servers/nodes/{node.id}">
      {getNodeDisplayName(node)}
    </a>
  </td>
  <td class="align-middle text-nowrap">{kindLabel(node)}</td>
  <td class="align-middle text-nowrap">
    {#if nodeBootstrapBadge(node)}
      <span class="badge text-bg-{nodeBootstrapBadge(node).colour}">
        {$_(nodeBootstrapBadge(node).label)}
      </span>
    {:else}
      <span class="text-body-secondary">—</span>
    {/if}
  </td>
  <td class="align-middle text-nowrap">{node.runtime || NodeRuntimes.PROCESS}</td>
  <td class="align-middle text-nowrap">
    <span class="d-inline-flex align-items-center gap-2">
      <span class="status-dot bg-{nodeStatusColour(node)}"></span>
      {$_(nodeStatusLabel(node))}
    </span>
  </td>
  <td class="align-middle text-break">
    {node.version || '—'}
    {#if node.updateAvailable && !updateUnderway}
      <span
        class="badge text-bg-warning ms-1"
        use:tooltip={[
          node.platformVersion
            ? $_('pages.servers.nodes.update-hint', {
                values: { version: node.platformVersion },
              })
            : '',
          { placement: 'top' },
        ]}>
        {$_('pages.servers.nodes.update-available')}
      </span>
    {/if}
    {#if updateProgress}
      <DaemonUpdateProgress progress={updateProgress} compact class="mt-1" />
    {/if}
  </td>
  <td class="align-middle text-break font-monospace">{systemOf(node)}</td>
  <td class="align-middle">{serverCountOf(node)}</td>
  <td class="usage-cell">
    <div class="d-flex align-items-center gap-2">
      <VitalsGauge
        value={ratio(metrics.cpu, 100)}
        text=""
        label={$_('pages.servers.nodes.column-cpu')}
        detail={cpuText(metrics.cpu)}
        dangerAbove={90}
        size="34px" />
      <span class="small font-monospace">{cpuText(metrics.cpu)}</span>
    </div>
  </td>
  <td class="usage-cell">
    <div class="d-flex align-items-center gap-2">
      <VitalsGauge
        value={ratio(metrics.memUsed, metrics.memTotal)}
        text=""
        label={$_('pages.servers.nodes.column-memory')}
        detail={bytesText(metrics.memUsed, metrics.memTotal)}
        dangerAbove={90}
        size="34px" />
      <span class="small font-monospace">{bytesText(metrics.memUsed, metrics.memTotal)}</span>
    </div>
  </td>
  <td class="usage-cell">
    <div class="d-flex align-items-center gap-2">
      <VitalsGauge
        value={ratio(metrics.diskUsed, metrics.diskTotal)}
        text=""
        label={$_('pages.servers.nodes.column-disk')}
        detail={bytesText(metrics.diskUsed, metrics.diskTotal)}
        dangerAbove={90}
        size="34px" />
      <span class="small font-monospace">{bytesText(metrics.diskUsed, metrics.diskTotal)}</span>
    </div>
  </td>
  <td class="align-middle text-nowrap">
    {#if node.lastSeen}
      <DateComponent time={node.lastSeen} relativeFormat />
    {:else}
      <span class="text-body-secondary">{$_('pages.servers.nodes.never-seen')}</span>
    {/if}
  </td>
</tr>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import DateComponent from '$lib/components/Date.svelte';
  import DaemonUpdateProgress from '$lib/components/servers/DaemonUpdateProgress.svelte';
  import VitalsGauge from '$lib/components/servers/VitalsGauge.svelte';
  import { formatBytes } from '$lib/string.util.js';
  import {
    getNodeDisplayName,
    nodeBootstrapBadge,
    NodeKinds,
    NodeRuntimes,
    nodeStatusColour,
    nodeStatusLabel,
  } from '$lib/nodes.util.js';
  import tooltip from '$lib/tooltip.util';

  export let node;
  export let metrics = {};
  export let canUpdate = false;
  export let updating = false;
  export let updateProgress = null;
  export let updateUnderway = false;
  export let selected = false;

  const dispatch = createEventDispatcher();

  function onRename() {
    dispatch('rename', { node });
  }

  function onUpdate() {
    dispatch('update', { node });
  }

  function onDelete() {
    dispatch('delete', { node });
  }

  function kindLabel(current) {
    return $_(
      String(current?.kind || '').toUpperCase() === NodeKinds.LOCAL
        ? 'pages.servers.nodes.kind-local'
        : 'pages.servers.nodes.kind-remote',
    );
  }

  function systemOf(current) {
    const resources = current?.resources || {};

    return (
      [current?.os ?? resources.os, current?.arch ?? resources.arch].filter(Boolean).join('/') ||
      '—'
    );
  }

  function serverCountOf(current) {
    if (Number.isFinite(Number(current?.serverCount))) {
      return Number(current.serverCount);
    }

    return Array.isArray(current?.servers) ? current.servers.length : 0;
  }

  function ratio(used, total) {
    if (used == null || !total) {
      return null;
    }

    return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
  }

  function cpuText(value) {
    const cpu = value == null ? null : Math.max(0, Math.min(100, Math.round(Number(value))));

    return cpu == null || !Number.isFinite(cpu) ? '—' : `${cpu}%`;
  }

  function bytesText(used, total) {
    if (used == null || total == null) {
      return '—';
    }

    return `${formatBytes(used, 1)} / ${formatBytes(total, 1)}`;
  }
</script>
