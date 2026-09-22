export function getActivityLogTranslation(log, translate) {
  if (!log) {
    return '';
  }

  const values = withDefaults(log.details);
  const globalKey = 'activity-logs.' + log.type;
  const globalTranslation = translate(globalKey, { values });

  if (globalTranslation !== globalKey) {
    return globalTranslation;
  }

  if (log.pluginId) {
    const pluginKey = `plugins.${log.pluginId}.activity-logs.${log.type}`;
    const pluginTranslation = translate(pluginKey, { values });

    if (pluginTranslation !== pluginKey) {
      return pluginTranslation;
    }
  }

  return globalTranslation;
}

/**
 * A log's details with the values a sentence may name but an entry can lack. Server entries name
 * their server by `serverName`, which the backend adds from the server as it is now; one whose
 * server has since been deleted only has its id left.
 *
 * @param {Record<string, any> | null | undefined} details
 * @returns {Record<string, any>}
 */
function withDefaults(details) {
  const values = { ...(details || {}) };

  if (values.serverName == null && values.serverId != null) {
    values.serverName = `#${values.serverId}`;
  }

  return values;
}

export function stripHtmlTags(value) {
  return String(value ?? '').replace(/<[^>]*>?/gm, '');
}
