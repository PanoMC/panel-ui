<div class="card">
  <div class="card-header">
    {$_('pages.player-detail.sessions')}
  </div>
  {#if !data.sessions || data.sessions.length === 0}
    <NoContent />
  {:else}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="align-middle">ID</th>
            <th class="align-middle"></th>
            <th class="align-middle">{$_('pages.player-detail.browser')}</th>
            <th class="align-middle">IP</th>
            <th class="align-middle">{$_('pages.player-detail.last-entrance')}</th>
            <th class="align-middle">{$_('pages.player-detail.expire-date')}</th>
            <th class="align-middle"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.sessions as session}
            <tr class:table-active={session.isCurrent}>
              <td class="align-middle">
                <code>#{session.id}</code>
              </td>
              <td class="align-middle">
                {#if session.isCurrent}
                  <span class="badge text-bg-primary"
                    >{$_('pages.player-detail.current-session')}</span>
                {/if}
              </td>
              <td class="align-middle">
                <span title={session.userAgent}>
                  {parseUserAgent(session.userAgent)}
                </span>
              </td>
              <td class="align-middle">
                <code>{session.ip}</code>
              </td>
              <td class="align-middle"><DateComponent time={session.lastActivityTime} /></td>
              <td class="align-middle"><DateComponent time={session.expireDate} /></td>
              <td class="align-middle text-end">
                <button
                  class="btn btn-link text-danger"
                  title={$_('buttons.logout')}
                  aria-label={$_('buttons.logout')}
                  onclick={() => logoutSession(session.id, session.isCurrent)}
                  disabled={loadingSessionId === session.id}>
                  {#if loadingSessionId === session.id}
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"
                    ></span>
                  {:else}
                    <i class="fas fa-sign-out-alt"></i>
                  {/if}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<script module>
  import { error } from '@sveltejs/kit';

  export async function load(event) {
    const parentData = await event.parent();
    const data = { ...parentData };
    const username = event.params.username;

    const body = await ApiUtil.get({
      path: `/api/panel/players/${username}/sessions`,
      request: event,
    });

    if (!body.error) {
      data.sessions = body.sessions;
    } else {
      throw error(500, body.error);
    }

    return data;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
  import { invalidateAll } from '$app/navigation';
  import ApiUtil from '$lib/api.util';
  import tooltip from '$lib/tooltip.util';
  import { parseUserAgent } from '$lib/string.util';
  import { logoutLoading } from '$lib/Store';
  import NoContent from '$lib/components/NoContent.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import { show as showConfirmModal } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { logout } from '$lib/Store';

  let { data } = $props();

  let loadingSessionId = $state(null);

  function logoutSession(sessionId, isCurrent) {
    if (isCurrent) {
      showConfirmModal('components.modals.logout-session-confirm.title', () => {
        logout();
      });
      return;
    }

    loadingSessionId = sessionId;

    ApiUtil.delete({
      path: `/api/panel/players/${data.username}/sessions/${sessionId}`,
      handler: async (body) => {
        loadingSessionId = null;

        if (body.error) {
          await showToast('errors.' + body.error);
          return;
        }

        await showToast('components.toasts.session-logged-out-successful');
        await invalidateAll();
      },
    });
  }
</script>
