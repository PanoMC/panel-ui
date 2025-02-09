import { browser } from "$app/environment";
import { get, writable } from "svelte/store";
import { getLocaleFromNavigator, init as initI18n, locale, register, waitLocale } from "svelte-i18n";
import { base } from "$app/paths";

export const loadedLanguages = writable([]);
export const languageLoading = writable(false);
export const currentLanguage = writable(null);
export const Languages = writable({});

async function fetchLanguages(event) {
  const response = await event.fetch(base + "/panel-api/languages");
  const languages = await response.json();
  Languages.set(languages);
}

export async function init(initialLocale, event) {
  await fetchLanguages(event);

  if (browser && !initialLocale) {
    initialLocale = get(locale);

    if (get(locale) === null) {
      initialLocale = getLocaleFromNavigator();
    }
  }

  const language = getLanguageByLocale(initialLocale);
  const languageToLoad = language || get(Languages)["en-US"];

  await loadLanguage(languageToLoad, event);
  currentLanguage.set(languageToLoad);

  initI18n({
    fallbackLocale: "en-US",
    initialLocale: languageToLoad.locale,
  });
}

export function getAcceptedLanguage(headers) {
  if (typeof headers.get("accept-language") === "undefined") {
    return "";
  }

  return headers.get("accept-language").split(",")[0];
}

export async function loadLanguage(language, event) {
  if (get(loadedLanguages).indexOf(language) !== -1) {
    return;
  }

  loadedLanguages.update((list) => {
    list.push(language);
    return list;
  });

  const useFetch = event ? event.fetch : fetch;

  const response = await useFetch(base + `/panel-api/languages/${language.locale}.json`);
  const languageFile = await response.json();

  register(language.locale, async () => languageFile);

  await waitLocale(language.locale);

  if (language.derivatives) {
    for (const derivative of language.derivatives) {
      register(derivative, async () => languageFile);
      await waitLocale(language.locale);
    }
  }
}

export async function changeLanguage(language) {
  if (get(currentLanguage) === language) {
    return;
  }

  languageLoading.set(true);

  if (get(loadedLanguages).indexOf(language) === -1) {
    await loadLanguage(language);
  }

  locale.set(language.locale);
  currentLanguage.set(language);

  languageLoading.set(false);
}

export function getLanguageByLocale(locale) {
  let foundLanguage = null;
  const languages = get(Languages);

  Object.keys(languages).forEach((key) => {
    const language = languages[key];
    if (language.locale === locale) {
      foundLanguage = language;
    }
  });

  return foundLanguage;
}
