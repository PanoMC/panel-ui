<!-- The game servers, nodes and agents whose jar the admin has to replace by hand (decision 46):
     one line each with the protocol they report, the protocol this Pano needs and the download
     link. Used inside an alert (design/alerts.md): a list, links in the alert's own colour. -->
<ul class="mb-2" data-compat-agents>
  {#each agents as agent (agent.type + ':' + agent.id)}
    <li>
      <b>{agent.name}</b>
      <span>({$_(AGENT_TYPE_KEYS[agent.type])})</span>
      {$_('components.compatibility-card.agent-protocol', {
        values: {
          protocol: agent.protocolVersion ?? '?',
          required: agent.minProtocolVersion ?? '?',
        },
      })}
      {#if agent.pluginVersion}
        <span class="font-monospace">{agent.pluginVersion}</span>
      {/if}
      {#if agent.downloadPath}
        <a class="alert-link ms-2" href={agent.downloadPath} download>
          {$_('components.compatibility-card.download-jar')}
        </a>
      {/if}
    </li>
  {/each}
</ul>

<script>
  import { _ } from 'svelte-i18n';

  import { AGENT_TYPE_KEYS } from './compat.util.js';

  /**
   * @type {{ agents: Array<{ type: string, id: any, name: string, protocolVersion: number | null,
   *   minProtocolVersion: number | null, pluginVersion: string | null, downloadPath: string | null }> }}
   */
  let { agents = [] } = $props();
</script>
