import { browser } from "$app/environment";
import { get, writable } from "svelte/store";
import { getLocaleFromNavigator, init as initI18n, locale, register, waitLocale } from "svelte-i18n";
import { base } from "$app/paths";
import ApiUtil from "$lib/api.util.js";

export const languageLoading = writable(false);
export const currentLanguage = writable(null);
export const Languages = writable({});

async function fetchLanguages(event) {
  const response = await ApiUtil.get({
    path: `/api/locales`,
    request: event,
  })
  const locales = response.data

  Languages.set(Object.fromEntries(locales.map(item => [item.code, item])));
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

  await loadLanguage(get(Languages)["en-US"], event);
  await loadLanguage(languageToLoad, event);
  currentLanguage.set(languageToLoad);

  await waitLocale();

  initI18n({
    fallbackLocale: "en-US",
    initialLocale: languageToLoad.code,
  });
}

export function getAcceptedLanguage(headers) {
  if (typeof headers.get("accept-language") === "undefined") {
    return "";
  }

  return headers.get("accept-language").split(",")[0];
}

export async function loadLanguage(language, event) {
  const useFetch = event ? event.fetch : fetch;

  const [localTranslationsResponse, translationsResponse] = await Promise.all([
    useFetch(base + `/panel-api/languages/${language.code}.json`),
    ApiUtil.get({
      path: `/api/locales/${language.code}/translations/types/PANEL`,
      request: event,
    }),
  ]);

  const languageFile = await localTranslationsResponse.json();
  const customTranslations = translationsResponse.result !== "ok" ? {} : translationsResponse.data

  const translations = unflattenObject({...flattenObject(languageFile), ...flattenObject(customTranslations)})

  register(language.code, async () => translations);

  await waitLocale(language.code);

  if (language.derivatives) {
    for (const derivative of language.derivatives) {
      register(derivative, async () => translations);
      await waitLocale(language.code);
    }
  }
}

export async function changeLanguage(language) {
  if (get(currentLanguage) === language) {
    return;
  }

  languageLoading.set(true);

  await loadLanguage(language);

  locale.set(language.code);
  currentLanguage.set(language);

  languageLoading.set(false);
}

export function getLanguageByLocale(locale) {
  let foundLanguage = null;
  const languages = get(Languages);

  Object.keys(languages).forEach((key) => {
    const language = languages[key];
    if (language.code === locale) {
      foundLanguage = language;
    }
  });

  return foundLanguage;
}

function flattenObject(obj, prefix = '', result = {}) {
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function unflattenObject(flatObj) {
  const result = {};
  for (const flatKey in flatObj) {
    const keys = flatKey.split('.');
    keys.reduce((acc, key, idx) => {
      if (idx === keys.length - 1) {
        acc[key] = flatObj[flatKey];
      } else {
        acc[key] = acc[key] || {};
      }
      return acc[key];
    }, result);
  }
  return result;
}
