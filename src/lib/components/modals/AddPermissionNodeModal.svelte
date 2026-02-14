{#if showModal}
  <div
    class="modal-backdrop fade show"
    on:click={closeModal}
    on:keydown={(e) => {
      if (e.key === 'Escape') closeModal();
    }}
    role="button"
    tabindex="0"
    aria-label={$_('buttons.close')}>
  </div>
  <div class="modal fade show d-block" tabindex="-1" role="dialog">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {$_('components.modals.add-permission-node.title')}
          </h5>
          <button
            type="button"
            class="btn-close"
            on:click={closeModal}
            aria-label={$_('buttons.close')}></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <div class="input-group">
              <input
                type="text"
                class="form-control form-control-lg"
                id="permissions-input"
                placeholder={$_('components.modals.add-permission-node.input-placeholder')}
                bind:value={permissionInput}
                on:keydown={handleInputKeydown}
                on:paste={handlePaste}
                autocomplete="off" />
            </div>
            <small class="form-text">
              {$_('components.modals.add-permission-node.help-text')}
            </small>
          </div>

          {#if selectedPermissions.length > 0}
            <div class="mb-3">
              <p class="mb-2 fw-bold">
                {$_('components.modals.add-permission-node.selected-permissions-label')}
              </p>
              <div class="d-flex flex-wrap gap-2" aria-label={$_('components.modals.add-permission-node.selected-permissions-label')}>
                {#each selectedPermissions as permission (permission)}
                  <span class="badge bg-primary d-flex align-items-center">
                    {permission}
                    <button
                      type="button"
                      class="btn-close btn-close-white ms-2"
                      style="width: 0.5rem; height: 0.5rem; padding: 0;"
                      on:click={() => removePermission(permission)}
                      aria-label={$_('buttons.remove')}
                      use:tooltip={[$_('buttons.remove')]}></button>
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <div class="mb-3">
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="value-switch"
                bind:checked={permissionValue} />
              <label class="form-check-label" for="value-switch">
                {$_('components.modals.add-permission-node.value-label', {
                  value: permissionValue ? 'true' : 'false',
                })}
              </label>
            </div>
          </div>

          <div class="mb-3">
            <p class="mb-2 fw-bold">
              {$_('components.modals.add-permission-node.expiry-label')}
            </p>
            <div class="btn-group w-100" role="group" aria-label={$_('components.modals.add-permission-node.expiry-label')}>
              <input
                type="radio"
                class="btn-check"
                name="expiry-option"
                id="expiry-never"
                autocomplete="off"
                bind:group={expiryType}
                value="never" />
              <label class="btn btn-outline-primary" for="expiry-never"
                >{$_('components.modals.add-permission-node.expiry-never')}</label>

              <input
                type="radio"
                class="btn-check"
                name="expiry-option"
                id="expiry-date"
                autocomplete="off"
                bind:group={expiryType}
                value="date" />
              <label class="btn btn-outline-primary" for="expiry-date"
                >{$_('components.modals.add-permission-node.expiry-date')}</label>
            </div>
            {#if expiryType === 'date'}
              <input
                type="datetime-local"
                class="form-control mt-2"
                id="expiry-date-input"
                bind:value={expiryDate} />
            {/if}
          </div>

          <div class="mb-3">
            <p class="mb-2 fw-bold">
              {$_('components.modals.add-permission-node.context-label')}
            </p>
            {#each contexts as context, index (index)}
              <div class="hstack gap-2 mb-2">
                <div class="input-group">
                  <select class="form-select" bind:value={context.keyType}>
                    <option value="world">{$_('components.modals.add-permission-node.context-types.world')}</option>
                    <option value="server">{$_('components.modals.add-permission-node.context-types.server')}</option>
                    <option value="custom">{$_('components.modals.add-permission-node.context-types.custom')}</option>
                  </select>
                  {#if context.keyType === 'custom'}
                    <input
                      type="text"
                      class="form-control"
                      placeholder={$_(
                        'components.modals.add-permission-node.context-key-placeholder',
                      )}
                      bind:value={context.key} />
                  {:else}
                    <span class="input-group-text">{context.keyType}</span>
                  {/if}
                  <select class="form-select" style="max-width: 120px;" bind:value={context.value}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
                <button
                  class="btn-close"
                  on:click={() => removeContext(index)}
                  aria-label={$_('buttons.remove')}
                  use:tooltip={[$_('buttons.remove')]}>
                </button>
              </div>
            {/each}
            <button class="btn btn-primary btn-sm" type="button" on:click={addContext}>
              <i class="fas fa-plus me-2"></i>{$_(
                'components.modals.add-permission-node.add-context-button',
              )}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-primary w-100"
            on:click={addPermissions}
            disabled={selectedPermissions.length === 0}>
            {$_('components.modals.add-permission-node.add-permissions-button', {
              values: {
                count: selectedPermissions.length,
                plural: selectedPermissions.length !== 1 ? 's' : '',
              },
            })}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Add Permission Node Modal -->
<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';
  import { createEventDispatcher } from 'svelte';

  export let showModal = false;

  let permissionInput = '';
  let selectedPermissions = [];
  let permissionValue = true;
  let expiryType = 'never';
  let expiryDate = '';
  let contexts = [];

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
    resetModal();
  }

  function resetModal() {
    permissionInput = '';
    selectedPermissions = [];
    permissionValue = true;
    expiryType = 'never';
    expiryDate = '';
    contexts = [];
  }

  function addPermission(permission) {
    permission = permission.trim();
    if (permission && !selectedPermissions.includes(permission)) {
      selectedPermissions = [...selectedPermissions, permission];
    }
    permissionInput = '';
  }

  function removePermission(permission) {
    selectedPermissions = selectedPermissions.filter((p) => p !== permission);
  }

  function addContext() {
    contexts = [...contexts, { keyType: 'world', key: '', value: 'true' }];
  }

  function removeContext(index) {
    contexts = contexts.filter((_, i) => i !== index);
  }

  function handleInputKeydown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const permissions = permissionInput
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);
      permissions.forEach(addPermission);
    } else if (event.key === 'Backspace' && !permissionInput && selectedPermissions.length > 0) {
      selectedPermissions = selectedPermissions.slice(0, -1);
    }
  }

  function handlePaste(event) {
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    const permissions = paste
      .split(/[\n,\s]+/)
      .map((p) => p.trim())
      .filter((p) => p);
    permissions.forEach(addPermission);
  }

  function addPermissions() {
    if (selectedPermissions.length > 0) {
      const permissionData = {
        permissions: selectedPermissions,
        value: permissionValue,
        expiry: expiryType === 'date' ? expiryDate : null,
        contexts: contexts.filter((ctx) => ctx.value.trim() !== ''),
      };
      dispatch('add', permissionData);
      closeModal();
    }
  }
</script>
