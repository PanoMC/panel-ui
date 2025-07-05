import ApiUtil from "$lib/api.util.js";

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET(event) {
  const { locals: { jwt, csrfToken } } = event

  const response = await ApiUtil.get({ path: "/api/panel/locales", request: event, token: jwt, csrfToken })

  return new Response(JSON.stringify(response), {
    headers: {
      "Content-Type": "application/json"
    }
  })
}
