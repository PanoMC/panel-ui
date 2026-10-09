# Adding an API endpoint to a plugin

## Decide

| Decision         | Default                | Read it from                                                                                 |
| ---------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| Site or panel?   | site (`Api`)           | only admins use it, or a panel page calls it: panel (`PanelApi`)                             |
| Who may call it? | everyone (`Api`)       | needs a signed-in user: `LoggedInApi`; panel: `PanelApi` plus a permission check in `handle` |
| Paged?           | not paged: `{ items }` | the list can grow without bound (orders, logs, products): paged, `{ items, page }`           |

Ask only if a site endpoint would expose data of other users or of the admin and the request does not say who may read it.

## Rules

1. One class per endpoint, annotated `@Endpoint`, under `src/main/kotlin/<package>/routes/`.
2. Declare the path relative, without any prefix: `Path("/hello", RouteType.GET)`. Pano mounts it:
   - `Api` / `LoggedInApi`: `/api/plugins/<pluginId>/hello`
   - `PanelApi`: `/api/plugins/<pluginId>/panel/hello`
     Never write `/api`, `/v1`, the plugin id or `panel` into a declared path. The first segment cannot be `_` or `panel`.
3. Old addresses (`/api/v1/plugins/<id>/...`, `/api/v1/panel/plugins/<id>/...`) answer 404. There is no alias.
4. Core endpoints are `/api/v1/...` (panel: `/api/v1/panel/...`). Core endpoints about a plugin stay under
   `/api/v1/plugins/<id>/_/...` (translations, `openapi.json`, `ui.zip`, `ui/*`).
5. Success: `Successful(mapOf(...))`. A list goes under the key `items`. Only a list that is really paged adds
   `page: { number, size, totalItems, totalPages }`; read the request with `Paging.request(context)` (`page`, `pageSize`).
   An unpaged `{ "items": [...] }` is correct. Adding `page` later is additive; removing it is breaking.
6. Errors: throw or return a subclass of `com.panomc.platform.model.Error` with a declared code matching
   `^[A-Z][A-Z0-9_]*$`: `class SlugAlreadyExists : Error("SLUG_ALREADY_EXISTS", 409)`. The body is always
   `{ "error": { "code", "message"?, "details"?, "fields"? } }`. Never derive a code from a class name.
7. Describe the endpoint with `override val doc = EndpointDoc(summary, tag, response | paginatedItem, errors)`: the
   plugin's OpenAPI document and the generated client are built from it.
8. A panel endpoint checks its permission first: `authProvider.requirePermission(<Permission>(), context)`.
9. Inside one plugin the API is additive only: do not remove or rename a field or a path of a released plugin. A plugin
   that must break opens a version inside its own namespace (`/v2/...`).
10. Call it from the UI with relative paths through the plugin-scoped client, never a hard-coded `/api/...` string:

```js
import { api } from "@panomc/sdk/plugin-api";
const body = await api.get({ path: "/hello", request: event }); // site
const config = await api.panel.get({ path: "/config", request: event }); // panel
```

## Verify

```sh
./gradlew build -Pnoui            # compiles the endpoint
bunx pano-plugin check            # also runs the API path check: every path passed to `api` must be a Pano route
```

A mutation needs the CSRF token; the SDK client sends it. An external caller reads the plugin's OpenAPI document at
`/api/v1/plugins/<pluginId>/_/openapi.json`.

## Worked examples

| What                                 | File                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| The smallest site endpoint           | `pano-boilerplate-plugin/src/main/kotlin/com/panomc/plugins/boilerplate/routes/GetHelloAPI.kt`                                   |
| A paged site list with `EndpointDoc` | `pano-web-platform/plugins/pano-plugin-market/src/main/kotlin/com/panomc/plugins/market/routes/api/store/GetStoreProductsAPI.kt` |
| A paged panel list with a permission | `pano-web-platform/plugins/pano-plugin-faq/src/main/kotlin/com/panomc/plugins/faq/routes/panel/PanelGetFAQsAPI.kt`               |
| Declared error codes                 | `pano-web-platform/plugins/pano-plugin-market/src/main/kotlin/com/panomc/plugins/market/error/`                                  |
| The page and error shapes            | `pano-web-platform/Pano/src/main/kotlin/com/panomc/platform/model/Paging.kt`, `Error.kt`                                         |

Known rough edge: some older official endpoints still answer a list under its own key beside other data (faq's site
`/list` answers `faqs`). Do not copy that; new lists use `items`.

Human docs: `https://panomc.com/docs/addon/endpoints/`, `https://panomc.com/docs/integration/api-basics/`.
