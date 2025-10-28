<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    Migrate From Web Scripts
    <!-- Nav tabs -->
    <ul class="nav nav-tabs border-bottom-0" id="migrateTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="script1-tab"
          data-bs-toggle="tab"
          data-bs-target="#script1"
          type="button"
          role="tab"
          aria-controls="script1"
          aria-selected="true">
          Script 1
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="script2-tab"
          data-bs-toggle="tab"
          data-bs-target="#script2"
          type="button"
          role="tab"
          aria-controls="script2"
          aria-selected="false">
          Script 2
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="script3-tab"
          data-bs-toggle="tab"
          data-bs-target="#script3"
          type="button"
          role="tab"
          aria-controls="script3"
          aria-selected="false">
          Script 3
        </button>
      </li>
    </ul>
  </div>

  <div class="card-body">
    <!-- Tab panes -->
    <div class="tab-content">
      <div
        class="tab-pane active"
        id="script1"
        role="tabpanel"
        aria-labelledby="script1-tab">
        <NoContent text="Not available." />
      </div>
      <div
        class="tab-pane"
        id="script2"
        role="tabpanel"
        aria-labelledby="script2-tab">
        <NoContent text="Not available." />
      </div>
      <div
        class="tab-pane"
        id="script3"
        role="tabpanel"
        aria-labelledby="script3-tab">
        <NoContent text="Not available." />
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-header">Minecraft Plugin Migrations</div>
  <div class="card-body">...</div>
</div>

<script>
  import NoContent from "$lib/component/NoContent.svelte";
</script>
