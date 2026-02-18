<div class="container vstack gap-3">
  <PageActions>
    <div slot="left">
      {#if slots.left}
        {@render slots.left()}
      {:else}
        <PageNav>
          <PageNavItem href="/players/detail/{data.player.username}"
            >{$_('pages.player-detail.overview')}</PageNavItem>
          <PageNavItem href="/players/detail/{data.player.username}/sessions"
            >{$_('pages.player-detail.sessions')}</PageNavItem>
        </PageNav>
      {/if}
    </div>

    <div slot="right" class="hstack gap-2" data-layout-actions="right">
      {#if slots.right}
        {@render slots.right()}
      {:else}
        <div class="hstack gap-2">
          {#if hasPermission(Permissions.MANAGE_PLAYERS)}
            <button
              aria-label={$_('buttons.delete')}
              class="btn btn-link"
              use:tooltip={[$_('buttons.delete'), { placement: 'bottom' }]}
              on:click={() => showConfirmDeletePlayerModal(data.player)}
              class:disabled={$user.username === data.player.username ||
                (data.player.permissionGroup === 'admin' && !$user.admin)}>
              <i class="fas fa-trash"></i>
            </button>
            {#if data.player.isBanned}
              <button
                aria-label={$_('pages.player-detail.un-ban')}
                class="btn btn-link"
                use:tooltip={[$_('pages.player-detail.un-ban'), { placement: 'bottom' }]}
                on:click={() => showUnbanPlayerModal(data.player)}
                class:disabled={$user.username === data.player.username ||
                  (data.player.permissionGroup === 'admin' && !$user.admin)}>
                <i class="fas fa-gavel"></i>
              </button>
            {:else}
              <button
                aria-label={$_('pages.player-detail.ban')}
                class="btn btn-link"
                use:tooltip={[$_('pages.player-detail.ban'), { placement: 'bottom' }]}
                on:click={() => showConfirmBanPlayerModal(data.player)}
                class:disabled={$user.username === data.player.username ||
                  (data.player.permissionGroup === 'admin' && !$user.admin)}>
                <i class="fas fa-gavel"></i>
              </button>
            {/if}
            {#if !data.player.isEmailVerified}
              <button
                aria-label={$_('pages.player-detail.send-verification-mail')}
                class="btn btn-link"
                use:tooltip={[
                  $_('pages.player-detail.send-verification-mail'),
                  { placement: 'bottom' },
                ]}
                on:click={() => showConfirmSendVerificationEmailModal(data.player)}
                class:disabled={$user.username === data.player.username ||
                  (data.player.permissionGroup === 'admin' && !$user.admin) ||
                  !$siteInfo.emailEnabled}>
                <i class="fas fa-envelope"></i>
              </button>
            {/if}

            <a
              href="{base}/permissions"
              aria-label={$_('pages.player-detail.authorize')}
              class="btn btn-link"
              use:tooltip={[$_('pages.player-detail.authorize'), { placement: 'bottom' }]}
              class:disabled={$user.username === data.player.username ||
                (data.player.permissionGroup === 'admin' && !$user.admin)}>
              <i class="fas fa-user-circle"></i>
            </a>
          {/if}
          {#if hasPermission(Permissions.MANAGE_PLAYERS) || $user.username === data.player.username}
            <button
              class="btn btn-secondary"
              on:click={() => showEditPlayerModal(data.player)}
              class:disabled={data.player.permissionGroup === 'admin' && !$user.admin}>
              <i class="fas fa-pencil-alt"></i>
              <span class="d-lg-inline d-none ms-2"> {$_('buttons.edit')}</span>
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </PageActions>

  <div class="row g-3">
    <div class="col-lg-9 vstack gap-3">
      {@render children()}
    </div>
    <div class="col-lg-3">
      <div class="card">
        <div class="card-header">
          {data.player.username}
        </div>
        <div
          class="card-body d-flex flex-column
          align-items-center vstack gap-3">
          <img
            alt={data.player.username}
            class="img-thumbnail rounded animate__animated animate__zoomIn"
            width="128"
            height="128"
            class:border={isOnline || data.player.isBanned}
            class:border-3={isOnline || data.player.isBanned}
            class:border-success={!data.player.isBanned && isOnline}
            class:border-danger={data.player.isBanned}
            src="/api/profile/picture/{data.player.username}?{$avatarVersion}"
            use:tooltip={!data.player.isBanned && [
              isOnline
                ? $_('pages.player-detail.online-text', {
                    values: {
                      whereOnline: data.player.inGame
                        ? $_('pages.player-detail.in-game')
                        : $_('pages.player-detail.in-website'),
                    },
                  })
                : getOfflineRelativeDateText(checkTime, locales[$currentLanguage.dateFnsCode]),
              { placement: 'bottom' },
            ]} />

        </div>

        <table class="table">
          <tbody>
            <tr>
              <td>{$_('pages.player-detail.status')}</td>
              <td>
                <PlayerStatusBadge
                  banned={data.player.isBanned}
                  lastActivityTime={data.player.lastActivityTime}
                  inGame={data.player.inGame}
                  {checkTime} />
              </td>
            </tr>
            <tr>
              <td>{$_('pages.players.table.perm-group')}</td>
              <td>
                <PlayerPermissionBadge permissionGroup={data.player.permissionGroup} />
              </td>
            </tr>
            <tr>
              <td>{$_('pages.player-detail.email')}</td>
              <td>
                <span
                  class="badge {data.player.isEmailVerified
                    ? 'text-bg-success'
                    : 'text-bg-danger'}">
                  {#if data.player.isEmailVerified}
                    {$_('pages.player-detail.email-verified')}
                  {:else}
                    {$_('pages.player-detail.email-not-verified')}
                  {/if}
                </span>
              </td>
            </tr>
            <tr>
              <td>{$_('pages.player-detail.last-entrance')}</td>
              <td><DateComponent time={data.player.lastLoginDate} /></td>
            </tr>
            <tr>
              <td>{$_('pages.player-detail.register-date')}</td>
              <td><DateComponent time={data.player.registerDate} /></td>
            </tr>
            <tr>
              <td>{$_('pages.player-detail.register-ip')}</td>
              <td>{data.player.registeredIp}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script module>
  import ApiUtilModule, { buildQueryParams } from '$lib/api.util';
  import { error } from '@sveltejs/kit';
  import { executeHookLoad } from '$lib/PluginAPI.js';
  import { setContext } from 'svelte';

  const key = 'layout-slots';

  // layout calls
  export function initSlots() {
    const slots = $state({ right: null, left: null });
    setContext(key, slots);
    return slots;
  }

  /**
   * @type {import('@sveltejs/kit').LayoutLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const username = event.params.username;
    const ticketsPage = searchParams.get('ticketsPage') || 1;
    const banHistoryPage = searchParams.get('banHistoryPage') || 1;

    const queryParams = buildQueryParams({
      ticketsPage,
      banHistoryPage,
    });

    const body = await ApiUtilModule.get({
      path: `/api/panel/players/${username}` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === 'NOT_EXISTS' || body.error === 'PAGE_NOT_FOUND') {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.username = username;
    body.ticketsPage = parseInt(ticketsPage);
    body.banHistoryPage = parseInt(banHistoryPage);

    body.hookProps = {};
    body.hookProps['panel:player-detail:bottom'] = await executeHookLoad(
      'panel:player-detail:bottom',
      event,
    );

    return body;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import { base } from '$app/paths';
  import { beforeNavigate, goto, invalidate } from '$app/navigation';
  import { onMount, onDestroy, getContext } from 'svelte';
  import * as locales from 'date-fns/locale';
  import { formatRelative } from 'date-fns';

  import PageActions from '$lib/components/PageActions.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';
  import PlayerStatusBadge from '$lib/components/badges/PlayerStatusBadge.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import PlayerPermissionBadge from '$lib/components/badges/PlayerPermissionBadge.svelte';
  import tooltip from '$lib/tooltip.util';
  import { currentLanguage } from '$lib/language.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import ApiUtil from '$lib/api.util';
  import { avatarVersion } from '$lib/Store';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import {
    show as showEditPlayerModal,
    setCallback as setEditPlayerModalCallback,
  } from '$lib/components/modals/EditPlayerModal.svelte';
  import {
    show as showConfirmBanPlayerModal,
    setCallback as setConfirmBanPlayerModalCallback,
  } from '$lib/components/modals/ConfirmBanPlayerModal.svelte';
  import {
    show as showUnbanPlayerModal,
    setCallback as setUnbanPlayerModalCallback,
  } from '$lib/components/modals/UnbanPlayerModal.svelte';
  import { show as showConfirmDeletePlayerModal } from '$lib/components/modals/ConfirmDeletePlayerModal.svelte';
  import { show as showConfirmSendVerificationEmailModal } from '$lib/components/modals/ConfirmSendVerificationEmailModal.svelte';

  let { data, children } = $props();
  const slots = initSlots();

  const user = getContext('user');
  const siteInfo = getContext('siteInfo');
  const pageTitle = getContext('pageTitle');

  $effect(() => {
    pageTitle.set(data.player.username);
  });

  beforeNavigate(({ from, to }) => {
    if (from?.route.id !== to?.route.id) {
      Object.assign(slots, { right: null, left: null });
    }
  });

  let checkTime = $state(0);
  let interval;

  const isOnline = $derived(
    data.player.lastActivityTime > Date.now() - 5 * 60 * 1000 || data.player.inGame,
  );

  function getOfflineRelativeDateText(checkTime, locale) {
    return formatRelative(new Date(parseInt(data.player.lastActivityTime)), new Date(), {
      locale,
    }).capitalize();
  }



  setEditPlayerModalCallback((newPlayer) => {
    if (data.player.username !== newPlayer.username) {
      goto(base + '/players/detail/' + newPlayer.username);

      return;
    }

    data.player = newPlayer;
  });

  setConfirmBanPlayerModalCallback(async () => {
    await invalidate((_) => true);
  });

  setUnbanPlayerModalCallback(() => {
    data.player.isBanned = false;
  });

  onMount(() => {
    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>
