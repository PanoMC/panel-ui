<!-- Confirm Ban IP (panel) -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-network-wired fa-3x d-block m-auto text-gray"></i>
        </div>
        <div class="pb-3">{$_('components.modals.confirm-ban-ip.title')}</div>

        <div class="form-group text-start mb-3">
          <div class="d-flex flex-wrap gap-2 align-items-end justify-content-between">
            <div class="flex-grow-1" style="min-width: 12rem">
              <label for="ipBanField" class="form-label">{$_('pages.ip-bans.ip')}</label>
              <input
                type="text"
                class="form-control"
                id="ipBanField"
                name="ipBanField"
                autocomplete="off"
                bind:value={$ipAddress} />
            </div>
            <div>
              <button type="button" class="btn btn-outline-secondary" on:click={openPlayerSearchForIp}>
                {$_('components.modals.confirm-ban-ip.find-player')}
              </button>
            </div>
          </div>
        </div>

        <div class="form-group text-start mb-3">
          <label for="ipBanMessage" class="form-label"
            >{$_('components.modals.confirm-ban-player.ban-message')}</label>
          <textarea
            class="form-control"
            id="ipBanMessage"
            name="ipBanMessage"
            rows="3"
            maxlength="255"
            placeholder={$_('components.modals.confirm-ban-ip.ban-message-placeholder')}
            bind:value={$banMessage}>
          </textarea>
          <small class="float-end">{$banMessage.length}/255</small>
        </div>

        <div class="form-group text-start mb-3">
          <h6 class="mb-2">{$_('components.modals.confirm-ban-player.ban-duration')}</h6>
          <div class="btn-group w-100" role="group" aria-label="IP ban duration options">
            <input
              type="radio"
              class="btn-check"
              value="permanent"
              bind:group={$banDuration}
              id="ipBanPermanent"
              name="ipBanDuration"
              autocomplete="off" />
            <label class="btn btn-outline-primary" for="ipBanPermanent">
              {$_('components.modals.confirm-ban-player.permanent-ban')}
            </label>
            <input
              type="radio"
              class="btn-check"
              value="custom"
              bind:group={$banDuration}
              id="ipBanCustom"
              name="ipBanDuration"
              autocomplete="off" />
            <label class="btn btn-outline-primary" for="ipBanCustom">
              {$_('components.modals.confirm-ban-player.custom-duration')}
            </label>
            <input
              type="radio"
              class="btn-check"
              value="datetime"
              bind:group={$banDuration}
              id="ipBanDateTime"
              name="ipBanDuration"
              autocomplete="off" />
            <label class="btn btn-outline-primary" for="ipBanDateTime">
              {$_('components.modals.confirm-ban-player.custom-datetime')}
            </label>
          </div>

          {#if $banDuration === 'custom'}
            <div class="mt-2">
              <select class="form-select" bind:value={$customDuration}>
                <option value=""
                  >{$_('components.modals.confirm-ban-player.select-duration')}</option>
                <option value="15m">{$_('components.modals.confirm-ban-player.15-minutes')}</option>
                <option value="30m">{$_('components.modals.confirm-ban-player.30-minutes')}</option>
                <option value="1h">{$_('components.modals.confirm-ban-player.1-hour')}</option>
                <option value="3h">{$_('components.modals.confirm-ban-player.3-hours')}</option>
                <option value="6h">{$_('components.modals.confirm-ban-player.6-hours')}</option>
                <option value="12h">{$_('components.modals.confirm-ban-player.12-hours')}</option>
                <option value="1d">{$_('components.modals.confirm-ban-player.1-day')}</option>
                <option value="3d">{$_('components.modals.confirm-ban-player.3-days')}</option>
                <option value="7d">{$_('components.modals.confirm-ban-player.1-week')}</option>
                <option value="30d">{$_('components.modals.confirm-ban-player.1-month')}</option>
                <option value="180d">{$_('components.modals.confirm-ban-player.6-months')}</option>
                <option value="365d">{$_('components.modals.confirm-ban-player.1-year')}</option>
              </select>
            </div>
          {/if}

          {#if $banDuration === 'datetime'}
            <div class="mt-2">
              <input
                type="datetime-local"
                class="form-control"
                bind:value={$customDateTime}
                min={new Date().toISOString().slice(0, 16)}
                step="60" />
            </div>
          {/if}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={onSubmit}>
          {$_('buttons.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const ipAddress = writable('');

  let callback = () => {};
  let hideCallback = () => {};
  let modal;

  const banMessage = writable('');
  const banDuration = writable('permanent');
  const customDuration = writable('');
  const customDateTime = writable('');

  /**
   * @param {{ initialIp?: string } | undefined} payload
   */
  export function show(payload = {}) {
    ipAddress.set((payload && payload.initialIp) || '');
    banMessage.set('');
    banDuration.set('permanent');
    customDuration.set('');
    customDateTime.set('');

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    modal.show();
  }

  export function hide() {
    hideCallback();

    modal?.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import ApiUtil from '$lib/api.util.js';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import {
    show as showSearchPlayerModal,
    setCallback as setSearchPlayerModalCallback,
  } from '$lib/components/modals/SearchPlayerModal.svelte';

  import { _ } from 'svelte-i18n';

  let loading;

  function openPlayerSearchForIp() {
    setSearchPlayerModalCallback((u) => {
      if (!u) return;
      const rip = (u.registeredIp && String(u.registeredIp).trim()) || '';
      if (!rip) {
        showToast('components.modals.confirm-ban-ip.toast-no-registered-ip');
        return;
      }
      ipAddress.set(rip);
    });
    showSearchPlayerModal({ selectOnlyBadge: true });
  }

  function calculateDuration() {
    if ($banDuration === 'permanent') {
      return null;
    }

    if ($banDuration === 'custom') {
      const now = new Date();
      let durationMs = 0;

      switch ($customDuration) {
        case '15m':
          durationMs = 15 * 60 * 1000;
          break;
        case '30m':
          durationMs = 30 * 60 * 1000;
          break;
        case '1h':
          durationMs = 1 * 60 * 60 * 1000;
          break;
        case '3h':
          durationMs = 3 * 60 * 60 * 1000;
          break;
        case '6h':
          durationMs = 6 * 60 * 60 * 1000;
          break;
        case '12h':
          durationMs = 12 * 60 * 60 * 1000;
          break;
        case '1d':
          durationMs = 24 * 60 * 60 * 1000;
          break;
        case '3d':
          durationMs = 3 * 24 * 60 * 60 * 1000;
          break;
        case '7d':
          durationMs = 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          durationMs = 30 * 24 * 60 * 60 * 1000;
          break;
        case '180d':
          durationMs = 180 * 24 * 60 * 60 * 1000;
          break;
        case '365d':
          durationMs = 365 * 24 * 60 * 60 * 1000;
          break;
        default:
          return null;
      }

      return now.getTime() + durationMs;
    }

    if ($banDuration === 'datetime' && $customDateTime) {
      return new Date($customDateTime).getTime();
    }

    return null;
  }

  function onSubmit() {
    const trimmedIp = ($ipAddress || '').trim();
    if (!trimmedIp) {
      showToast('components.modals.confirm-ban-ip.toast-ip-required');
      return;
    }

    loading = true;

    const duration = calculateDuration();
    const body = {
      ip: trimmedIp,
      banMessage: $banMessage,
    };

    if (duration !== null) {
      body.duration = duration;
    }

    ApiUtil.post({
      path: '/api/panel/banned-ips',
      body,
      handler: (res, reject) => {
        if (res.error) {
          if (res.error === 'ALREADY_IP_BANNED' || res.error === 'INVALID_IP_ADDRESS') {
            location.reload();
            return;
          }
          reject(res.error);
          return;
        }

        hide();

        showToast('components.modals.confirm-ban-ip.toast-banned', {
          values: { ip: trimmedIp },
        });

        if (res.result === 'ok') {
          callback();
        }

        loading = false;
      },
    });
  }
</script>
