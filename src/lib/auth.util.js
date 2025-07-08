import { get } from "svelte/store";
import { page } from "$app/stores";

export const Permissions = Object.freeze({
  ACCESS_PANEL: "access_panel",
  MANAGE_SERVERS: "manage_servers",
  MANAGE_POSTS: "manage_posts",
  MANAGE_TICKETS: "manage_tickets",
  MANAGE_PLAYERS: "manage_players",
  MANAGE_VIEW: "manage_view",
  MANAGE_ADDONS: "manage_addons",
  MANAGE_PLATFORM_SETTINGS: "manage_platform_settings",
  MANAGE_PERMISSION_GROUPS: "manage_permission_groups",
  ACCESS_ACTIVITY_LOGS: "access_activity_logs",
  MANAGE_TRANSLATIONS: "manage_translations"
});

export function hasPermission(permission, user) {
  if (!user) {
    const { user: pageUser } = get(page).data;

    user = pageUser;
  }

  const userObject = user;

  if (userObject.admin) {
    return true;
  }

  if (!userObject.permissions) {
    return false;
  }

  return userObject.permissions.includes(permission);
}
