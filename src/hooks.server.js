import {
  COOKIE_PREFIX,
  JWT_COOKIE_NAME,
  CSRF_TOKEN_COOKIE_NAME, updateApiUrl
} from "$lib/variables";

import ApiUtil, { networkErrorBody } from "$lib/api.util.js";

async function fetchBasicData(token, csrfToken) {
  return ApiUtil.get({ path: "/api/panel/basicData", token, csrfToken }).catch(
    () => networkErrorBody,
  );
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, event: { cookies }, resolve }) {
  const locals = {};

  // noinspection JSUnresolvedReference
  const apiUrlEnv = process.env.API_URL;

  if (apiUrlEnv) {
    updateApiUrl(apiUrlEnv);
    locals.apiUrlEnv = apiUrlEnv
  }

  const jwt = cookies.get([COOKIE_PREFIX + JWT_COOKIE_NAME]);
  const csrfToken = cookies.get([COOKIE_PREFIX + CSRF_TOKEN_COOKIE_NAME]);

  locals.basicData = await fetchBasicData(jwt, csrfToken);

  locals.jwt = jwt;
  locals.csrfToken = csrfToken;

  event.locals = locals;

  return resolve(event);
}
