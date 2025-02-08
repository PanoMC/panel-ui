<article class="container">
  <!-- Action Menu -->
  <div
    class="row justify-content-between align-items-center mb-3 animate__animated animate__slideInUp">
    <div class="col-auto">
      <a class="btn btn-link" role="button" href="{base}/players/perm-groups">
        <i class="fas fa-arrow-left me-2"></i>
        {$_('pages.permission-group-detail.permission-groups')}
      </a>
    </div>
    <div class="col-auto">
      <button
        class="btn"
        class:btn-secondary="{data.mode === Modes.CREATE}"
        class:btn-primary="{data.mode === Modes.EDIT}"
        type="submit"
        class:disabled="{saveButtonDisabled}"
        on:click="{onSubmit}">
        {#if data.mode === Modes.EDIT}
          {$_('pages.permission-group-detail.save')}
        {:else}
          {$_('pages.permission-group-detail.create')}
        {/if}
      </button>
    </div>
  </div>

  <div class="row">
    <div class="col mb-xl-0 mb-3">
      <div class="card h-100">
        <div class="card-body">
          <input
            class:text-danger="{errors.name}"
            class:text-black="{!errors.name}"
            class="form-control form-control-lg mb-3"
            placeholder="{$_('pages.permission-group-detail.inputs.name.placeholder')}"
            id="permissionGroupName"
            type="text"
            bind:value="{name}"
            disabled="{data.name === 'admin'}" />

          <form on:submit|preventDefault="{addUser}">
            <input
              class="form-control mb-3"
              id="addPlayerInput"
              bind:value="{username}"
              class:border-danger="{usernameInputError}"
              disabled="{checkingUsername}"
              placeholder="{$_('pages.permission-group-detail.inputs.player.placeholder')}" />
          </form>

          {#each data.users as user, index (user)}
            <a
              use:tooltip="{[$_('pages.permission-group-detail.remove'), { placement: 'bottom' }]}"
              href="javascript:void(0);"
              on:click="{() => removeUser(index)}">
              <span class="badge rounded-pill bg-light link-dark text-center">
                <img
                  class="d-inline rounded-circle me-2"
                  src="https://minotar.net/avatar/{user}"
                  alt="{user}"
                  width="28"
                  height="28" />
                {user}
              </span>
            </a>
          {/each}
        </div>
      </div>
    </div>
    <div class="col-xl-4">
      <div class="card">
        <div class="card-body">
          <table class="table table-sm table-hover mb-0">
            <tbody>
              {#each data.permissionList as permission, index (permission)}
                <tr>
                  <th
                    scope="col"
                    use:tooltip="{[
                      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vehicula, enim in fermentum accumsan,',
                      { placement: 'right' },
                    ]}">
                    <!--              TODO: Icon system-->
                    <!--              <Icon-->
                    <!--                data="{icon[convertIconName(permission.iconName)]}"-->
                    <!--                class="text-primary d-block m-auto" />-->
                    <small class="mb-0">
                      {permission.name}
                    </small>
                  </th>
                  <td>
                    <div
                      class="form-check form-switch d-flex justify-content-end align-content-center">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        id="{permission.name}"
                        checked="{isPermissionChecked(permission)}"
                        on:click="{() => onPermissionClick(permission)}"
                        disabled="{isPermissionDisabled()}" />
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</article>

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  export const Modes = Object.freeze({
    EDIT: "edit",
    CREATE: "create",
  });

  export const DefaultMode = Modes.CREATE;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, mode = DefaultMode) {
    const { parent } = event;
    await parent();

    let data = {
      id: -1,
      name: "",
      users: [],
      permissions: [],
      permissionGroupPerms: [],
      mode,
    };

    if (mode === Modes.EDIT) {
      const id = event.params.id;

      const permissionGroupsBody = await ApiUtil.get({
        path: `/api/panel/permissionGroups/${id}`,
        request: event,
      })

      if (permissionGroupsBody.error) {
        if (permissionGroupsBody.error === "NOT_EXISTS") {
          throw error(404, permissionGroupsBody.error);
        }

        throw error(500, permissionGroupsBody.error);
      }

      data = { ...data, ...permissionGroupsBody };
    }

    const getPermissionsBody = await ApiUtil.get({
      path: "/api/panel/permissions",
      request: event,
    })

    if (getPermissionsBody.error) {
      throw error(500, getPermissionsBody.error);
    }

    data = { ...data, ...getPermissionsBody };

    data.permissionList = data.permissions;
    data.permissions = data.permissionList.map((permission) => {
      return {
        id: permission.id,
        selected: data.name === "admin",
      };
    });

    if (data.name !== "admin") {
      data.permissionGroupPerms.forEach((permissionGroupPerm) => {
        data.permissions.forEach((permission) => {
          if (permission.id === permissionGroupPerm) {
            permission.selected = true;
          }
        });
      });
    }

    data.originalPermissions = [];
    data.permissions.forEach((permission) => {
      data.originalPermissions.push({ ...permission });
    });

    data.originalUsers = [];
    data.users.forEach((user) => {
      data.originalUsers.push(Object.freeze(user));
    });

    return data;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";
  import { goto } from "$app/navigation";

  import tooltip from "$lib/tooltip.util";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set(
    data.mode === Modes.EDIT ? "pages.permission-group-detail.title-edit" : "pages.permission-group-detail.title-create"
  );

  let errors = [];
  let loading;
  let name = data.name;

  let checkingUsername;
  let username = "";
  let usernameInputError;

  let addedUsers = [];
  let removedUsers = [];

  $: saveButtonDisabled =
    loading ||
    !name ||
    (data.name === name &&
      !isPermissionListDifferent(data.originalPermissions, data.permissions) &&
      addedUsers.length === 0 &&
      removedUsers.length === 0);

  function isPermissionChecked(permission) {
    if (data.name === "admin") {
      return true;
    }

    const permissionChecked = data.permissions.filter((filteredPermission) => {
      return (
        filteredPermission.selected && filteredPermission.id === permission.id
      );
    });

    return permissionChecked.length !== 0;
  }

  function isPermissionListDifferent(originalPermissions, permissions) {
    let isDifferent = false;

    permissions.forEach((permission) => {
      const isSame = originalPermissions.filter(
        (originalPermission) =>
          originalPermission.id === permission.id &&
          originalPermission.selected === permission.selected
      );

      if (isSame.length === 0) {
        isDifferent = true;
      }
    });

    return isDifferent;
  }

  function isPermissionDisabled() {
    return data.name === "admin";
  }

  function onPermissionClick(permission) {
    data.permissions.forEach((eachPermission) => {
      if (eachPermission.id === permission.id) {
        eachPermission.selected = !isPermissionChecked(permission);
      }
    });

    data.permissions = data.permissions;
  }

  async function addUser() {
    errors = [];

    if (!username) {
      return;
    }

    if (data.users.indexOf(username) !== -1) {
      usernameInputError = true;

      return;
    }

    checkingUsername = true;

    await ApiUtil.get({
      path: `/api/panel/players/${username}/exists`,
      handler: (body) => {
        checkingUsername = false;

        if (body.error) {
          errors = { error: body.error };
          usernameInputError = true;

          return;
        }

        usernameInputError = false;

        data.users.push(username);
        data.users = data.users;

        if (removedUsers.indexOf(username) !== -1) {
          removedUsers.remove(removedUsers.indexOf(username));
        }

        if (data.originalUsers.indexOf(username) === -1) {
          addedUsers.push(username);
        }

        username = "";
      }
    })
  }

  function removeUser(index) {
    const username = data.users[index];

    data.users = data.users.remove(index);

    if (addedUsers.indexOf(username) !== -1) {
      addedUsers.remove(addedUsers.indexOf(username));
    }

    if (data.originalUsers.indexOf(username) !== -1) {
      removedUsers.push(username);
    }
  }

  function onSubmit() {
    loading = true;
    errors = [];

    const bodyHandler = (body, reject) => {
      if (body.result === "ok") {
        loading = false;

        showToast('components.toasts.permission-group-saved-or-created.permission-group', {
          "event": data.mode === Modes.EDIT ? $_('components.toasts.permission-group-saved-or-created.updated'): $_('components.toasts.permission-group-saved-or-created.saved')
        });

        if (data.mode === Modes.CREATE) {
          goto(base + "/players/perm-groups/detail/" + body.id);
        } else {
          data.originalPermissions = [];
          data.permissions.forEach((permission) => {
            data.originalPermissions.push({ ...permission });
          });
        }

        addedUsers.forEach((addedUser) => {
          data.originalUsers.push(addedUser);
        });

        removedUsers.forEach((addedUser) => {
          data.originalUsers.remove(data.originalUsers.indexOf(addedUser));
        });

        addedUsers = [];
        removedUsers = [];

        return
      } else if (body.error) {
        loading = false;

        showToast('components.toasts.permission-group-save-error', {
          errorCode: body.error,
        });

        return
      } else if (body.errors) {
        loading = false;

        errors = body.errors;

        return
      }

      reject();
    };

    if (data.mode === Modes.EDIT) {
      ApiUtil.put({
        path: `/api/panel/permissionGroups/${data.id}`,
        body: {
          name,
          addedUsers,
          removedUsers,
          permissions: data.permissions,
        },
        handler: bodyHandler
      })

      return;
    }

    ApiUtil.post({
      path: `/api/panel/permissionGroups`,
      body: {
        name,
        addedUsers,
        permissions: data.permissions,
      },
      handler: bodyHandler
    })
  }

  // function convertIconName(iconName) {
  //   const iconNameSplit = iconName.split("-");
  //   let restOfIconName = "";
  //
  //   iconNameSplit
  //     .filter((iconName, index) => index !== 0)
  //     .forEach((iconName) => {
  //       restOfIconName += iconName.capitalize();
  //     });
  //
  //   return iconNameSplit[0] + restOfIconName;
  // }

  // String.prototype.capitalize = function () {
  //   return this.charAt(0).toUpperCase() + this.slice(1);
  // };
</script>
