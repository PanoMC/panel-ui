{#if showHeader}
  <div class="d-flex flex-row justify-content-between align-items-center mb-3">
    <h6 class="mb-0">{$_('pages.permissions.panel.editor.title')}</h6>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-sm btn-primary" on:click={openAddPermissionModal}>
        <i class="fa fa-plus me-1"></i>{$_('pages.permissions.panel.editor.add-node-count', {
          values: {
            count: permissions.length,
          },
        })}
      </button>
      <button type="button" class="btn btn-sm btn-secondary" on:click={handleAddPermGroup}>
        <i class="fa fa-plus me-1"></i>{$_('pages.permissions.panel.editor.add-group-count', {
          values: {
            count: permissionGroupsCount,
          },
        })}
      </button>
    </div>
  </div>
{/if}

{#if permissions.length === 0}
  <NoContent />
{:else}
  <div class="table-responsive">
    <table class="table table-responsive">
      <thead>
        <tr>
          <th style="width: 10%;"></th>
          <th style="width: 35%;">{$_('pages.permissions.panel.editor.permission')}</th>
          <th style="width: 15%;">{$_('pages.permissions.panel.editor.value')}</th>
          <th style="width: 25%;">{$_('pages.permissions.panel.editor.expiry')}</th>
          <th style="width: 15%;">{$_('pages.permissions.panel.editor.contexts')}</th>
        </tr>
      </thead>
      <tbody>
        {#each permissions as node, index (index)}
          <tr>
            <!-- Remove Button -->
            <td class="align-middle text-center">
              <button
                type="button"
                class="btn-close"
                aria-label={$_('buttons.remove')}
                title={$_('buttons.remove')}
                on:click={() => removePermissionNode(index)}>
              </button>
            </td>
            <!-- Text Input -->
            <td>
              <input
                type="text"
                class="form-control form-control-sm"
                value={node.permission}
                placeholder={$_('pages.permissions.panel.editor.placeholder')}
                on:input={(e) => updatePermissionNode(index, 'permission', e.target.value)} />
            </td>

            <!-- Value -->
            <td>
              <select
                class="form-select form-select-sm"
                value={node.value}
                on:change={(e) => updatePermissionNode(index, 'value', e.target.value === 'true')}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </td>

            <!-- Expiry -->
            <td>
              <select
                class="form-select form-select-sm"
                value={node.expiry ? 'date' : 'never'}
                on:change={(e) => handleExpiryChange(index, e.target.value)}>
                <option value="never">{$_('pages.permissions.panel.editor.never')}</option>
                <option value="date">{$_('pages.permissions.panel.editor.date')}</option>
              </select>
              {#if node.expiry}
                <input
                  type="datetime-local"
                  class="form-control form-control-sm mt-1"
                  value={node.expiry.toISOString().slice(0, 16)}
                  on:change={(e) =>
                    updatePermissionNode(index, 'expiry', new Date(e.target.value))} />
              {/if}
            </td>

            <!-- Contexts -->
            <td>
              <span class="badge text-bg-primary">none</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import NoContent from '$lib/component/NoContent.svelte';

  export let permissions = [];
  export let permissionGroupsCount = 0;
  export let showHeader = true;
  export const isAdmin = false; // Reserved for future admin features

  const dispatch = createEventDispatcher();

  // Permission node structure
  function createPermissionNode(permission = '', value = true, expiry = null, contexts = 'none') {
    return {
      permission,
      value,
      expiry, // null for never, or Date object
      contexts,
    };
  }

  function handleAddPermGroup() {
    dispatch('addPermGroup');
  }

  function removePermissionNode(index) {
    permissions = permissions.filter((_, i) => i !== index);
    dispatch('permissionsChanged', { permissions });
  }

  function updatePermissionNode(index, field, value) {
    permissions = permissions.map((node, i) => (i === index ? { ...node, [field]: value } : node));
    dispatch('permissionsChanged', { permissions });
  }

  function handleExpiryChange(index, value) {
    if (value === 'never') {
      updatePermissionNode(index, 'expiry', null);
    } else {
      updatePermissionNode(index, 'expiry', new Date(value));
    }
  }
</script>
