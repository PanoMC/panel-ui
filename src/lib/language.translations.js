/**
 * Which texts go on top of the panel's own language file.
 *
 * `GET /locales/<code>/translations/types/PANEL` answers a signed-in panel user only: it carries the
 * admin's edits of the panel texts. On the sign-in page nobody is signed in yet, so it is refused,
 * and with it went the texts of the plugins that draw there (a second factor, a captcha, a social
 * button). Those are public: the THEME answer carries the same `plugins` object, so that part, and
 * only that part, is taken from it.
 *
 * @param {any} panelAnswer the PANEL answer, or an error body
 * @param {() => Promise<any>} loadPublic asks for the THEME answer; called only when PANEL was refused
 * @returns {Promise<Record<string, any>>}
 */
export async function customTranslations(panelAnswer, loadPublic) {
  if (panelAnswer && !panelAnswer.error) {
    return panelAnswer.data ?? {};
  }

  try {
    const publicAnswer = await loadPublic();
    const plugins = publicAnswer?.error ? null : publicAnswer?.data?.plugins;

    return plugins && typeof plugins === 'object' ? { plugins } : {};
  } catch {
    return {};
  }
}
