export function getActivityLogTranslation(log, translate) {
  if (!log) {
    return '';
  }

  const globalKey = 'activity-logs.' + log.type;
  const globalTranslation = translate(globalKey, { values: log.details });

  if (globalTranslation !== globalKey) {
    return globalTranslation;
  }

  if (log.pluginId) {
    const pluginKey = `plugins.${log.pluginId}.activity-logs.${log.type}`;
    const pluginTranslation = translate(pluginKey, { values: log.details });

    if (pluginTranslation !== pluginKey) {
      return pluginTranslation;
    }
  }

  return globalTranslation;
}

export function stripHtmlTags(value) {
  return String(value ?? '').replace(/<[^>]*>?/gm, '');
}
