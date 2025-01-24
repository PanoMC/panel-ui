<!-- About Sup Page -->
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Pano Platform Info</h5>
    <form class="animate__animated animate__fadeIn">
      <div class="row">
        <label class="col-md-6 col-form-label" for="panoVersion">
          {$_("pages.settings.about.version")}
        </label>
        <div class="col-md-6 col-form-label">
          <span aria-describedby="panoVersion" id="panoVersion"
            >{data.platformVersion}</span>
        </div>
      </div>
      <div class="row">
        <label class="col-md-6 col-form-label" for="siteKeywords">
          {$_("pages.settings.about.release")}
        </label>
        <div class="col-md-6 col-form-label">
          <span aria-describedby="panoRelease" id="panoRelease"
            >{data.platformStage}</span>
        </div>
      </div>
      <div class="row mb-0">
        <label class="col-md-6 col-form-label" for="siteKeywords">
          {$_("pages.settings.about.website")}
        </label>
        <div class="col-md-6 col-form-label">
          <a
            aria-describedby="panoWebsite"
            href="https://panomc.com"
            id="panoWebsite"
            target="_blank">
            panomc.com <i class="fa-solid fa-up-right-from-square ms-2"></i>
          </a>
        </div>
      </div>
      <div class="row mb-0">
        <label class="col-md-6 col-form-label" for="siteKeywords">
          {$_("pages.settings.about.discord")}
        </label>
        <div class="col-md-6 col-form-label">
          <a
            aria-describedby="panoWebsite"
            href="https://panomc.com/discord"
            id="panoWebsite"
            target="_blank">
            panomc.com/discord <i class="fa-solid fa-up-right-from-square ms-2"
            ></i>
          </a>
        </div>
      </div>
    </form>
  </div>
</div>

<div class="card">
  <div class="card-body animate__animated animate__fadeIn">
    <h5
      class="card-title animate__animated animate__heartBeat animate__slower d-inline-block">
      {$_("pages.settings.about.open-source-licenses")} ❤️
    </h5>

    <!-- Software License -->

    <details>
      <summary class="h6 text-primary">Title</summary>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia quisquam
        assumenda dolor eligendi fugit, architecto ab vero possimus minus
        consequatur delectus aut quam voluptatem debitis ullam ea voluptate
        inventore rem!
      </p>
    </details>
  </div>
</div>

<script context="module">
  import ApiUtil from "$lib/api.util.js";

  async function loadData({ request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: "/api/panel/settings/about",
        request,
      }).then((body) => {
        if (body.result === "ok") {
          resolve(body);
        } else {
          reject(body);
        }
      });
    });
  }

  /**
   * @type {import("@sveltejs/kit").Load}
   */
  export async function load(event) {
    const { parent } = event;
    const parentData = await parent();

    let data = {
      platformVersion: "",
      platformStage: "",
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({ request: event }).then((body) => {
      data = { ...data, ...body };
    });

    return data;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.settings.about.title");
</script>
