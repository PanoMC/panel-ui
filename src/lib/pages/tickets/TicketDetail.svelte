<style global>
  .answer > p {
    margin-bottom: 0;
  }
</style>

<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a
      class="btn btn-link"
      title={$_('pages.ticket-detail.tickets')}
      aria-label={$_('pages.ticket-detail.tickets')}
      role="button"
      href="{base}/tickets"
      slot="left">
      <i class="fas fa-arrow-left"></i>
    </a>

    <div class="hstack gap-2" slot="right">
      <button
        title={$_('buttons.delete')}
        aria-label={$_('buttons.delete')}
        class="btn btn-link"
        type="button"
        on:click={() => showDeleteTicketModal([data.ticket.id])}>
        <i class="fas fa-trash"></i>
      </button>
      {#if data.ticket.status !== TicketStatuses.CLOSED}
        <button
          title={$_('buttons.close')}
          aria-label={$_('buttons.close')}
          class="btn btn-secondary"
          type="button"
          on:click={() => showCloseTicketModal([data.ticket.id])}>
          <i class="fas fa-check me-2"></i>
          {$_('buttons.close')}
        </button>
      {/if}
    </div>
  </PageActions>

  <div class="card">
    <div class="card-header">
      <div class="row">
        <div class="col">
          <h5 class="card-title text-truncate mb-0" title={data.ticket.title}>
            #{data.ticket.id}: {data.ticket.title}
          </h5>
          <small class="mb-0">
            {@html $_('pages.ticket-detail.by-who', {
              values: {
                username: `<a class="rounded focus-ring" href="${base}/players/detail/${data.ticket.username}"
          >${data.ticket.username}</a>`,
              },
            })}
            <Date time={data.ticket.date} />,
            {@html $_('pages.ticket-detail.opened-in-category', {
              values: {
                category: `<a href="${base}/tickets?categoryUrl=${data.ticket.category.url}"
          >${
            data.ticket.category.title === '-'
              ? $_('pages.ticket-detail.no-category')
              : data.ticket.category.title
          }</a>`,
              },
            })}
          </small>
        </div>
        <div class="col-auto">
          <TicketStatusBadge status={data.ticket.status} />
        </div>
      </div>
    </div>
    <div
      class="card-body"
      id="messageSection"
      bind:this={messagesSectionDiv}
      bind:clientHeight={$messagesSectionClientHeight}>
      {#if data.ticket.messages.length < data.ticket.count && data.ticket.count > 5}
        <div class="d-flex justify-content-center mb-3">
          <button
            class="btn btn-sm btn-secondary"
            class:disabled={loadMoreLoading}
            on:click={loadMore}
            ><i class="fas fa-arrow-up me-2"></i>
            {$_('pages.ticket-detail.previous-messages', {
              values: {
                count: data.ticket.count - (data.ticket.messages.length - sentMessageCount),
              },
            })}
          </button>
        </div>
      {/if}

      <div class="vstack gap-2">
        {#each data.ticket.messages as message, index (message)}
          {#if message.panel}
            <div class="row g-2 flex-nowrap">
              <div class="col vstack align-items-end">
                <div class="card rounded-5 bg-transparent border shadow-sm">
                  <div class="card-body answer px-3">
                    {@html message.message}
                  </div>
                </div>
                <small class="text-body-secondary mt-1">
                  <Date time={message.date} relativeFormat={true} />
                </small>
              </div>
              <div class="col-auto">
                <a href="{base}/players/detail/{message.username}" class="rounded focus-ring">
                  <img
                    src="/api/profile/picture?username={message.username}{$avatarVersion}"
                    alt={message.username}
                    class="rounded-circle animate__animated animate__zoomIn"
                    use:tooltip={[message.username, { placement: 'bottom' }]}
                    width="48"
                    height="48" />
                </a>
              </div>
            </div>
          {:else}
            <div class="row g-2 flex-nowrap">
              <div class="col-auto">
                <a href="{base}/players/detail/{message.username}">
                  <img
                    src="/api/profile/picture?username={message.username}{$avatarVersion}"
                    alt={message.username}
                    class="rounded-circle animate__animated animate__zoomIn"
                    use:tooltip={[message.username, { placement: 'bottom' }]}
                    width="48"
                    height="48" />
                </a>
              </div>
              <div class="col vstack align-items-start">
                <div class="card rounded-5 text-bg-primary border-0 shadow-sm">
                  <div class="card-body px-3">
                    {message.message}
                  </div>
                </div>
                <small class="text-body-secondary mt-1">
                  <Date time={message.date} relativeFormat={true} />
                </small>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
    <div class="card-footer" class:d-none={data.ticket.status === TicketStatuses.CLOSED}>
      <!-- Send Message Section -->
      <Editor bind:content={messageText} bind:isEmpty={isEditorEmpty}>
        <button
          class="btn btn-secondary"
          on:click={sendMessage}
          class:disabled={messageSendLoading || isEditorEmpty}
          disabled={messageSendLoading || isEditorEmpty}
          title={$_('pages.ticket-detail.send-button')}
          aria-label={$_('pages.ticket-detail.send-button')}>
          <i class="fas fa-paper-plane"></i>
        </button>
      </Editor>
    </div>
  </div>
</div>

<script context="module">
  import { writable } from 'svelte/store';

  import ApiUtil from '$lib/api.util.js';

  import { TicketStatuses } from '$lib/components/badges/TicketStatusBadge.svelte';
  import Editor from '$lib/components/Editor.svelte';
  import { error } from '@sveltejs/kit';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const id = event.params.id;

    const body = await ApiUtil.get({
      path: `/api/panel/tickets/${id}`,
      request: event,
    });

    if (body.error) {
      if (body.error === 'NOT_EXISTS' || body.error === 'PAGE_NOT_FOUND') {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.ticket.id = parseInt(id);

    return body;
  }
</script>

<script>
  import { afterUpdate, getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import tooltip from '$lib/tooltip.util.js';

  import {
    setCallback as setCloseTicketModalCallback,
    show as showCloseTicketModal,
  } from '$lib/components/modals/ConfirmCloseTicketModal.svelte';
  import {
    setCallback as setDeleteTicketModalCallback,
    show as showDeleteTicketModal,
  } from '$lib/components/modals/ConfirmDeleteTicketModal.svelte';

  import Date from '$lib/components/Date.svelte';
  import TicketStatusBadge from '$lib/components/badges/TicketStatusBadge.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import { avatarVersion } from '$lib/Store';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('#' + data.ticket.id + ' ' + limitTitle(data.ticket.title));

  let messagesSectionDiv;
  let loadMoreLoading = false;
  let messageSendLoading = false;

  let messageText = '';
  let isEditorEmpty = true;

  let shouldScroll = true;

  let sentMessageCount = 0;

  const messagesSectionClientHeight = writable(0);

  function loadMore() {
    loadMoreLoading = true;

    ApiUtil.get({
      path: `/api/panel/tickets/${data.ticket.id}/messages?lastMessageId=${data.ticket.messages[0].id}`,
      handler: (body, reject) => {
        if (body.error) {
          if (body.error === 'NOT_EXISTS') {
            goto(base + '/error-404');

            return;
          }

          reject();
          return;
        }

        body.messages.reverse().forEach((message) => {
          data.ticket.messages.unshift(message);
        });

        data.ticket.messages = data.ticket.messages;
      },
    });
  }

  function sendMessage() {
    messageSendLoading = true;

    ApiUtil.post({
      path: `/api/panel/tickets/${data.ticket.id}/messages`,
      body: {
        message: messageText,
      },
      handler: (body, reject) => {
        if (body.error) {
          if (body.error === 'NOT_EXISTS') {
            goto(base + '/error-404');

            return;
          }

          reject();
          return;
        }

        shouldScroll = true;

        data.ticket.messages.push(body.message);

        sentMessageCount++;

        data.ticket.status = TicketStatuses.REPLIED;
        messageText = '';

        messageSendLoading = false;
      },
    });
  }

  function limitTitle(text) {
    const limit = 32;

    if (text.length > limit) {
      text = text.substring(0, limit) + '...';
    }

    return text;
  }

  setCloseTicketModalCallback(() => {
    data.ticket.status = TicketStatuses.CLOSED;
  });

  setDeleteTicketModalCallback(() => {
    goto(base + '/tickets');
  });

  afterUpdate(() => {
    if (shouldScroll && messagesSectionDiv.scrollHeight > 0) {
      messagesSectionDiv.scrollTo(0, messagesSectionDiv.scrollHeight);

      shouldScroll = false;
    }
  });

  onMount(() => {
    shouldScroll = true;
  });
</script>
