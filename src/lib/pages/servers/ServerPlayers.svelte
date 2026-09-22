<style>
  .player-search {
    max-width: 250px;
  }

  .player-uuid {
    font-size: 0.75rem;
  }
</style>

<div class="container vstack gap-3">
  <ServerCapabilityNotice
    server={$server}
    feature="players.list"
    section="components.server-navigation-menu.players" />

  <!-- §2.4.35 — while nothing can list the players the notice above is the whole page: an empty
       roster under it would only say the same thing less precisely. -->
  {#if rosterCapable}
    <div class="card">
      <CardHeader>
        <span slot="left" class="d-flex align-items-center gap-2">
          {$_('pages.servers.players.title')}
          <span class="badge rounded-pill text-bg-secondary">
            {$_('pages.servers.players.online-count', {
              values: { online: onlineCount, max: maxPlayerCount },
            })}
          </span>
        </span>

        <span slot="right" class="player-search w-100">
          <SearchInput onchange={(value) => (query = value)} />
        </span>
      </CardHeader>

      {#if loading}
        <div class="card-body d-flex justify-content-center py-5">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
        </div>
      {:else if !visiblePlayers.length}
        <div class="card-body">
          <NoContent
            icon="fa-solid fa-users fa-3x"
            text={query.trim()
              ? $_('pages.servers.players.no-matches')
              : rosterLive
                ? $_('pages.servers.players.empty')
                : $_('pages.servers.players.empty-offline')} />
        </div>
      {:else}
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <Hook
                  name="panel:servers:players:table:header:start"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
                {#if showActions}
                  <th scope="col" class="text-center text-nowrap"
                    >{$_('pages.servers.players.column-actions')}</th>
                {/if}
                <th scope="col" class="text-nowrap">{$_('pages.servers.players.column-player')}</th>
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.players.column-account')}</th>
                <th scope="col" class="text-nowrap">{$_('pages.servers.players.column-ping')}</th>
                {#if hasGamemodeColumn}
                  <th scope="col" class="text-nowrap"
                    >{$_('pages.servers.players.column-gamemode')}</th>
                {/if}
                <th scope="col" class="text-nowrap"
                  >{$_('pages.servers.players.column-session')}</th>
                {#if hasIpColumn}
                  <th scope="col" class="text-nowrap">{$_('pages.servers.players.column-ip')}</th>
                {/if}
                <Hook
                  name="panel:servers:players:table:header:end"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
              </tr>
            </thead>
            <tbody>
              {#each visiblePlayers as player (player.uuid)}
                <tr>
                  <Hook
                    name="panel:servers:players:table:row:start"
                    {player}
                    tag="td"
                    class="align-middle text-nowrap" />
                  {#if showActions}
                    <th scope="row" class="text-center">
                      <!-- A disabled button drops pointer events, so the tooltip sits on the wrapper. -->
                      <span
                        class="d-inline-block dropdown position-static"
                        use:tooltip={[
                          actionsDisabledReason
                            ? $_(actionsDisabledReason, {
                                values: {
                                  section: $_('components.server-navigation-menu.players'),
                                },
                              })
                            : '',
                          { placement: 'right' },
                        ]}>
                        <button
                          type="button"
                          class="btn btn-link"
                          aria-expanded="false"
                          aria-haspopup="true"
                          data-bs-toggle="dropdown"
                          disabled={!!actionsDisabledReason || busyUuid === player.uuid}
                          aria-label={$_('pages.servers.players.column-actions')}>
                          {#if busyUuid === player.uuid}
                            <span class="spinner-border spinner-border-sm" aria-hidden="true"
                            ></span>
                          {:else}
                            <span class="fas fa-ellipsis-v"></span>
                          {/if}
                        </button>
                        <div class="dropdown-menu dropdown-menu-start">
                          {#if canModerate}
                            <button
                              type="button"
                              class="dropdown-item"
                              on:click={() => openTextModal(player, 'KICK')}>
                              <i class="fa-solid fa-door-open me-2" aria-hidden="true"></i>
                              {$_('pages.servers.players.action-kick')}
                            </button>
                            <button
                              type="button"
                              class="dropdown-item"
                              on:click={() => openTextModal(player, 'MESSAGE')}>
                              <i class="fa-regular fa-comment me-2" aria-hidden="true"></i>
                              {$_('pages.servers.players.action-message')}
                            </button>
                          {/if}

                          {#if canModerate || canRunCommands}
                            <!-- A Pano account is banned by Pano; anyone else only on this server's
                               own list, which a proxy does not have. -->
                            <span
                              class="d-block"
                              use:tooltip={[banDisabledReason(player), { placement: 'right' }]}>
                              <button
                                type="button"
                                class="dropdown-item text-danger"
                                disabled={!!banDisabledReason(player)}
                                on:click={() => openBanModal(player)}>
                                <i class="fa-solid fa-gavel me-2" aria-hidden="true"></i>
                                {$_('pages.servers.players.action-ban')}
                              </button>
                            </span>
                          {/if}

                          {#if canRunCommands}
                            {#if !isProxy}
                              <div class="dropdown-divider"></div>
                              <!-- Only the one that changes something, once the server has said
                                 which side the player is on; both while it has not. -->
                              {#if player.op !== true}
                                <button
                                  type="button"
                                  class="dropdown-item"
                                  on:click={() => runAction(player, 'OP')}>
                                  <i class="fa-solid fa-user-shield me-2" aria-hidden="true"></i>
                                  {$_('pages.servers.players.action-op')}
                                </button>
                              {/if}
                              {#if player.op !== false}
                                <button
                                  type="button"
                                  class="dropdown-item"
                                  on:click={() => runAction(player, 'DEOP')}>
                                  <i class="fa-solid fa-user-minus me-2" aria-hidden="true"></i>
                                  {$_('pages.servers.players.action-deop')}
                                </button>
                              {/if}

                              <h6 class="dropdown-header">
                                {$_('pages.servers.players.action-gamemode')}
                              </h6>
                              {#each GAMEMODES as gamemode (gamemode)}
                                <button
                                  type="button"
                                  class="dropdown-item d-flex align-items-center"
                                  class:active={player.gamemode === gamemode}
                                  disabled={player.gamemode === gamemode}
                                  aria-current={player.gamemode === gamemode ? 'true' : undefined}
                                  on:click={() => runAction(player, 'GAMEMODE', { gamemode })}>
                                  <i
                                    class="{GAMEMODE_ICONS[gamemode]} fa-fw me-2"
                                    aria-hidden="true"></i>
                                  {$_('pages.servers.players.gamemode-' + gamemode)}
                                  {#if player.gamemode === gamemode}
                                    <i class="fa-solid fa-check ms-auto ps-2" aria-hidden="true"
                                    ></i>
                                  {/if}
                                </button>
                              {/each}
                            {/if}

                            <div class="dropdown-divider"></div>
                            {#if player.whitelisted !== true}
                              <button
                                type="button"
                                class="dropdown-item"
                                on:click={() => runAction(player, 'WHITELIST_ADD')}>
                                <i class="fa-solid fa-list-check me-2" aria-hidden="true"></i>
                                {$_('pages.servers.players.action-whitelist-add')}
                              </button>
                            {/if}
                            {#if player.whitelisted !== false}
                              <button
                                type="button"
                                class="dropdown-item"
                                on:click={() => runAction(player, 'WHITELIST_REMOVE')}>
                                <i class="fa-solid fa-list-ul me-2" aria-hidden="true"></i>
                                {$_('pages.servers.players.action-whitelist-remove')}
                              </button>
                            {/if}
                          {/if}
                        </div>
                      </span>
                    </th>
                  {/if}

                  <td>
                    <div class="d-flex align-items-center gap-2 min-w-0">
                      <img
                        src="/api/profile/picture/{player.username}?{$avatarVersion}"
                        alt={player.username}
                        width="32"
                        height="32"
                        class="rounded-circle flex-shrink-0" />
                      <div class="min-w-0">
                        <!-- Only an account has a player page to open. -->
                        {#if player.panoUser}
                          <a
                            class="text-decoration-none text-truncate d-block"
                            href="{base}/players/detail/{player.username}">
                            {player.username}
                          </a>
                        {:else}
                          <span class="text-truncate d-block">{player.username}</span>
                        {/if}
                        {#if player.op || player.whitelisted}
                          <span class="d-flex gap-1 my-1">
                            {#if player.op}
                              <span class="badge text-bg-warning">
                                <i class="fa-solid fa-user-shield me-1" aria-hidden="true"></i>
                                {$_('pages.servers.players.badge-op')}
                              </span>
                            {/if}
                            {#if player.whitelisted}
                              <span class="badge text-bg-secondary">
                                <i class="fa-solid fa-list-check me-1" aria-hidden="true"></i>
                                {$_('pages.servers.players.badge-whitelisted')}
                              </span>
                            {/if}
                          </span>
                        {/if}
                        <button
                          type="button"
                          class="player-uuid btn btn-link p-0 text-body-secondary text-decoration-none font-monospace text-truncate d-block"
                          on:click={() => copyUuid(player.uuid)}>
                          {player.uuid}
                          <i class="fa-regular fa-copy ms-1" aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>
                  </td>

                  <!-- Decides what Ban does: a Pano ban for an account, this server's own list
                     otherwise. -->
                  <td class="text-nowrap">
                    {#if player.panoUser}
                      <span
                        class="text-success"
                        use:tooltip={[
                          $_('pages.servers.players.account-yes-hint'),
                          { placement: 'top' },
                        ]}>
                        <i class="fa-solid fa-circle-check me-1" aria-hidden="true"></i>
                        {$_('pages.servers.players.account-yes')}
                      </span>
                    {:else}
                      <span
                        class="text-body-secondary"
                        use:tooltip={[
                          $_('pages.servers.players.account-no-hint'),
                          { placement: 'top' },
                        ]}>
                        <i class="fa-regular fa-circle me-1" aria-hidden="true"></i>
                        {$_('pages.servers.players.account-no')}
                      </span>
                    {/if}
                  </td>

                  <td class="text-nowrap {pingClass(player.ping)}">
                    {player.ping == null
                      ? $_('pages.servers.players.ping-unknown')
                      : $_('pages.servers.players.ping-value', { values: { ping: player.ping } })}
                  </td>

                  {#if hasGamemodeColumn}
                    <td class="text-nowrap">
                      {#if player.gamemode}
                        <i
                          class="{GAMEMODE_ICONS[player.gamemode] ??
                            'fa-solid fa-gamepad'} fa-fw me-1 text-body-secondary"
                          aria-hidden="true"></i>
                        {$_('pages.servers.players.gamemode-' + player.gamemode)}
                      {:else}
                        <span class="text-body-secondary"
                          >{$_('pages.servers.players.gamemode-unknown')}</span>
                      {/if}
                    </td>
                  {/if}

                  <td class="text-nowrap">{formatSession(player.loginTime, checkTime)}</td>

                  {#if hasIpColumn}
                    <td class="text-nowrap font-monospace small">{player.ip || '-'}</td>
                  {/if}
                  <Hook
                    name="panel:servers:players:table:row:end"
                    {player}
                    tag="td"
                    class="align-middle text-nowrap" />
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      {#if sampledList}
        <!-- §2.4.17 — no plugin to ask, so the roster is what the server list ping answered:
           exact count, but only the handful of names the sample carries. -->
        <div class="card-footer small text-body-secondary">
          <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
          {$_('pages.servers.players.sample-hint')}
        </div>
      {/if}
    </div>
  {/if}
</div>

<ServerPlayerActionModal />
<ConfirmBanPlayerModal />

<script context="module">
  import { fetchServerPlayers } from '$lib/servers.util.js';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { params } = event;

    // A server that is offline, or a source that refuses, answers with a status the table shows
    // as an empty roster — the page still opens.
    return {
      serverId: Number(params.id),
      serverPlayers: await fetchServerPlayers(params.id, event),
    };
  }
</script>

<script>
  /**
   * SM-14 — the live in-game roster of one linked server (§2.4.2).
   *
   * Hydrated from `GET /players`, then kept live by two feeds: `players` frames replace the
   * roster on join/quit, and the 10-second `metrics` sample refreshes the pings (the roster
   * frame itself is only sent when the set of players changes). Every action is one
   * `POST /players/:uuid/action`; OP/de-op/gamemode are composed into console commands by the
   * backend, so they need the `commands` capability and are meaningless on a proxy.
   */
  import { getContext, onDestroy, onMount } from 'svelte';
  import { intervalToDuration } from 'date-fns';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { browser } from '$app/environment';
  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util.js';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import Hook from '$lib/components/Hook.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import ServerCapabilityNotice from '$lib/components/servers/ServerCapabilityNotice.svelte';
  import ConfirmBanPlayerModal, {
    show as showConfirmBanPlayerModal,
  } from '$lib/components/modals/ConfirmBanPlayerModal.svelte';
  import ServerPlayerActionModal, {
    show as showServerPlayerActionModal,
  } from '$lib/components/modals/ServerPlayerActionModal.svelte';
  import tooltip from '$lib/tooltip.util';
  import { avatarVersion } from '$lib/Store.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';
  import {
    featureSource,
    featureUnavailableReason,
    featureValue,
    hasCapability,
    hasFeature,
    isPluginConnected,
    isServerOnline,
    normalizeServerPlayers,
    ServerCapabilities as Capabilities,
    showServerActionError,
    showServerLoadError,
  } from '$lib/servers.util.js';
  import {
    onServerMetrics,
    onServerPlayers,
    subscribeServerMetrics,
    subscribeServerPlayers,
  } from '$lib/panelRealtime.js';

  export let data;

  const server = getContext('server');

  /** Proxies have no world, so these are rejected server-side for VELOCITY / BUNGEECORD. */
  const PROXY_TYPES = ['VELOCITY', 'BUNGEECORD'];
  const GAMEMODES = ['survival', 'creative', 'adventure', 'spectator'];
  /** @type {Record<string, string>} */
  const GAMEMODE_ICONS = {
    survival: 'fa-solid fa-heart',
    creative: 'fa-solid fa-cubes',
    adventure: 'fa-solid fa-compass',
    spectator: 'fa-solid fa-eye',
  };

  /** @type {Array<{ uuid: string, username: string, ping: number|null, loginTime: number, ip?: string }>} */
  let players = [];
  /** Only ever true for a fetch this page had to make itself; the first roster comes with it. */
  let loading = false;
  let query = '';
  let busyUuid = null;
  let checkTime = 0;
  let clock;
  let hydratedId = null;
  let wiredId = null;
  /** Set by `onDestroy`: a hydrate still in flight must not attach feeds to a dead page. */
  let destroyed = false;
  let releasePlayers;
  let releaseMetrics;
  let offPlayers;
  let offMetrics;
  /** `null` until the roster's availability was first seen, so opening the page never re-reads. */
  let wasRosterCapable = null;
  /** Player count as the latest metrics sample saw it; falls back to the roster length. */
  let sampleCount = null;
  let sampleMax = null;

  $: serverId = $server?.id ?? null;
  // First, before anything that reads what it sets (`players`, the sample counts): legacy `$:`
  // cannot see assignments made inside a function, so a reader declared earlier runs on the
  // empty roster and is not re-run until the next live frame.
  $: hydrate(data, serverId);
  // Only the legacy path reads this: without a `features` map the roster is the plugin's.
  $: online = isPluginConnected($server);
  $: isProxy = PROXY_TYPES.includes(String($server?.type || '').toUpperCase());
  // §2.4.17 — one source answers for all of them: the plugin dispatches the action, or Pano
  // composes the same console command and sends it through the node's stdin. Without
  // `features` the two menus are split by capability exactly as they were.
  $: actionsSource = featureSource($server, 'players.actions');
  $: canModerate =
    hasPermission(Permissions.MANAGE_SERVER_PLAYERS) &&
    (actionsSource === undefined
      ? hasCapability($server, Capabilities.PLAYERS)
      : actionsSource !== null);
  $: canRunCommands =
    hasPermission(Permissions.MANAGE_SERVER_PLAYERS) &&
    (actionsSource === undefined
      ? hasCapability($server, Capabilities.COMMANDS)
      : actionsSource !== null);
  $: showActions = canModerate || canRunCommands;

  // The roster itself — the plugin's full list, or the server list ping's sample.
  $: listSource = featureSource($server, 'players.list');
  $: rosterCapable = hasFeature($server, 'players.list');
  // Whether an empty table means "nobody is playing" or "nobody could be asked".
  $: rosterLive = listSource === undefined ? online : listSource !== null;
  // Once the roster can be asked for again (the server started, the node reconnected), it is
  // read afresh rather than left as the empty one the page opened with.
  $: rosterAvailabilityChanged(rosterCapable);
  $: sampledList = featureValue($server, 'players.listQuality') === 'sample';
  $: actionsDisabledReason =
    actionsSource === undefined
      ? !rosterCapable
        ? featureUnavailableReason($server, 'players.list')
        : !online
          ? 'pages.servers.players.actions-disabled-offline'
          : ''
      : actionsSource === null
        ? featureUnavailableReason($server, 'players.actions')
        : '';

  $: onlineCount = sampleCount ?? players.length;
  $: maxPlayerCount = sampleMax ?? $server?.maxPlayerCount ?? 0;
  $: hasIpColumn = players.some((player) => !!player.ip);
  // A proxy has no game mode and a ping sample does not say, so the column only exists when
  // someone on the list actually has one.
  $: hasGamemodeColumn = players.some((player) => !!player.gamemode);

  $: needle = query.trim().toLowerCase();
  $: visiblePlayers = needle
    ? players.filter(
        (player) =>
          player.username.toLowerCase().includes(needle) ||
          String(player.uuid).toLowerCase().includes(needle),
      )
    : players;

  // The feeds are per server, so they follow the id rather than the mount.
  $: if (browser && serverId != null && wiredId !== serverId) {
    wiredId = serverId;
    attach(serverId);
  }

  /**
   * @param {boolean} now whether anything can list the players right now.
   */
  function rosterAvailabilityChanged(now) {
    if (browser && now && wasRosterCapable === false && serverId != null && !destroyed) {
      void loadPlayers(serverId);
    }

    wasRosterCapable = now;
  }

  /**
   * @param {object | undefined} pageData
   * @param {number | null} currentId
   */
  function hydrate(pageData, currentId) {
    const id = Number(pageData?.serverId ?? currentId);

    if (!Number.isFinite(id) || hydratedId === id) {
      return;
    }

    hydratedId = id;

    const result = pageData?.serverPlayers;

    if (!result) {
      // Only reachable if the component is rendered outside its own route.
      if (browser) {
        void loadPlayers(id);
      }

      return;
    }

    applyPlayers(result);
  }

  /**
   * @param {Awaited<ReturnType<typeof fetchServerPlayers>>} result
   */
  function applyPlayers(result) {
    loading = false;
    sampleMax = null;

    if (result.status !== 'ok') {
      players = [];
      sampleCount = null;

      // An empty table is all the page can show; the toast is what names why it is empty —
      // unless it is a state, which the notice above the table explains (§2.4.35).
      if (browser && result.status === 'error') {
        showServerLoadError(result.error, serverId);
      }

      return;
    }

    players = result.players;
    sampleCount = result.online;
    sampleMax = result.max;
  }

  /**
   * @param {number} id
   */
  async function loadPlayers(id) {
    players = [];
    sampleCount = null;
    sampleMax = null;
    loading = true;

    const result = await fetchServerPlayers(id);

    if (destroyed || hydratedId !== id) {
      return;
    }

    applyPlayers(result);
  }

  /**
   * @param {number} id
   */
  function attach(id) {
    stop();

    offPlayers = onServerPlayers((frame) => {
      if (Number(frame.serverId) !== Number(id)) {
        return;
      }

      players = normalizeServerPlayers(frame.players);
      sampleCount = players.length;
    });

    offMetrics = onServerMetrics((frame) => {
      if (Number(frame.serverId) !== Number(id) || !frame.sample) {
        return;
      }

      applyMetricsSample(frame.sample);
    });

    releasePlayers = subscribeServerPlayers(id);
    releaseMetrics = subscribeServerMetrics(id);
  }

  /**
   * Pings live in the metrics sample, which arrives every 10 s; the roster frame only fires on
   * join/quit. Merge instead of replacing so the roster keeps `loginTime` and `ip`.
   *
   * @param {{ players?: Array<object>, playerCount?: number, maxPlayerCount?: number }} sample
   */
  function applyMetricsSample(sample) {
    if (sample.playerCount != null) {
      sampleCount = Number(sample.playerCount);
    }

    if (sample.maxPlayerCount != null) {
      sampleMax = Number(sample.maxPlayerCount);
    }

    if (!Array.isArray(sample.players)) {
      return;
    }

    // The plugin sends a sample within a second of an op, whitelist or game mode change (its own
    // or anyone's `/op`), so this is what keeps the menu and the badges live, not just the ping.
    const live = new Map(
      normalizeServerPlayers(sample.players).map((player) => [player.uuid, player]),
    );

    players = players.map((player) => {
      const sampled = live.get(player.uuid);

      return sampled
        ? {
            ...player,
            ping: sampled.ping,
            op: sampled.op,
            whitelisted: sampled.whitelisted,
            gamemode: sampled.gamemode,
          }
        : player;
    });
  }

  function stop() {
    [offPlayers, offMetrics, releasePlayers, releaseMetrics].forEach((release) => {
      if (release) {
        release();
      }
    });

    offPlayers = undefined;
    offMetrics = undefined;
    releasePlayers = undefined;
    releaseMetrics = undefined;
  }

  /**
   * @param {number | null} ping
   */
  function pingClass(ping) {
    if (ping == null) {
      return 'text-body-secondary';
    }

    if (ping <= 80) {
      return 'text-success';
    }

    return ping <= 200 ? 'text-warning-emphasis' : 'text-danger';
  }

  /**
   * @param {number} loginTime epoch millis.
   * @param {number} _tick only there to re-run this on every clock tick.
   */
  function formatSession(loginTime, _tick) {
    if (!loginTime) {
      return '-';
    }

    const duration = intervalToDuration({ start: new Date(loginTime), end: new Date() });
    const days = (duration.months || 0) * 30 + (duration.days || 0);
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    const seconds = duration.seconds || 0;

    if (days) {
      return $_('pages.servers.players.session-days', { values: { days, hours } });
    }

    if (hours) {
      return $_('pages.servers.players.session-hours', { values: { hours, minutes } });
    }

    if (minutes) {
      return $_('pages.servers.players.session-minutes', { values: { minutes } });
    }

    return $_('pages.servers.players.session-seconds', { values: { seconds } });
  }

  /**
   * @param {string} uuid
   */
  function copyUuid(uuid) {
    copy(uuid);
    showSuccess('pages.servers.players.uuid-copied');
  }

  /**
   * @param {{ uuid: string, username: string }} player
   * @param {string} action
   */
  /**
   * Why this player cannot be banned from here, as a translated line; empty when they can.
   *
   * @param {{ username: string, panoUser: boolean }} player
   */
  function banDisabledReason(player) {
    if (player.panoUser) {
      return hasPermission(Permissions.MANAGE_PLAYERS)
        ? ''
        : $_('pages.servers.players.ban-needs-players-permission');
    }

    if (isProxy) {
      return $_('pages.servers.players.ban-no-command-on-proxy', {
        values: { username: player.username },
      });
    }

    if (!canRunCommands) {
      return $_('pages.servers.players.ban-needs-commands', {
        values: { username: player.username },
      });
    }

    return '';
  }

  /**
   * @param {{ uuid: string, username: string, panoUser: boolean }} player
   */
  function openBanModal(player) {
    if (serverId == null || banDisabledReason(player)) {
      return;
    }

    showConfirmBanPlayerModal(player, { id: serverId, panoUser: player.panoUser });
  }

  function openTextModal(player, action) {
    showServerPlayerActionModal(player, action, (text) => runAction(player, action, { text }));
  }

  /**
   * @param {{ uuid: string, username: string }} player
   * @param {string} action
   * @param {{ text?: string, gamemode?: string }} [extras]
   * @returns {Promise<boolean>} whether the backend accepted it.
   */
  async function runAction(player, action, extras = {}) {
    // The same answer the menu is disabled with: a node-driven action works on a managed server
    // whose plugin never connected, so "is the plugin online" is not the question any more.
    if (serverId == null || actionsDisabledReason || busyUuid) {
      return false;
    }

    busyUuid = player.uuid;

    try {
      const body = await ApiUtil.post({
        path: `/api/panel/servers/${serverId}/players/${encodeURIComponent(player.uuid)}/action`,
        body: { action, ...extras },
        handler: (response) => response,
      });

      if (!body) {
        return false;
      }

      if (body.error) {
        showServerActionError(body.error, body, { server: $server, feature: 'players.actions' });
        return false;
      }

      showSuccess('pages.servers.players.action-done', { username: player.username });

      return true;
    } finally {
      busyUuid = null;
    }
  }

  onMount(() => {
    clock = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    destroyed = true;
    stop();

    if (clock) {
      clearInterval(clock);
    }
  });
</script>
