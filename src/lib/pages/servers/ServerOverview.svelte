<style>
  .metric-tile {
    border: 1px solid var(--bs-border-color);
    border-radius: var(--bs-border-radius);
  }

  .metric-bar {
    height: 6px;
  }

  /* The mini console's dark ground runs to the card's bottom edge, so when the Recent activity
     card next to it is taller the extra room reads as more console, not as a gap. */
  /* Out of the flow, so the row's height comes from the console card and the list scrolls. */
  .activity-scroll {
    position: relative;
    flex: 1 1 auto;
    min-height: 364px;
  }

  .activity-scroll-inner {
    position: absolute;
    inset: 0;
    overflow-y: auto;
  }

  .mini-console {
    background-color: #11151c;
    border-bottom-left-radius: var(--bs-card-inner-border-radius);
    border-bottom-right-radius: var(--bs-card-inner-border-radius);
  }

  /* The statistics as packed columns: groups flow into the next column instead of one long
     table, and a group is never split across two. */
  .stats-columns {
    column-count: 1;
    column-gap: 2rem;
  }

  @media (min-width: 768px) {
    .stats-columns {
      column-count: 2;
    }
  }

  @media (min-width: 1400px) {
    .stats-columns {
      column-count: 3;
    }
  }

  .stats-group {
    break-inside: avoid;
    margin-bottom: 1rem;
  }

  .stats-group-title {
    margin-bottom: 0.25rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--bs-border-color);
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding: 0.3rem 0;
    font-size: 0.9rem;
    border-bottom: 1px solid var(--bs-border-color-translucent);
  }

  .stats-row:last-child {
    border-bottom: 0;
  }

  .stats-label {
    flex-shrink: 0;
  }

  .stats-value {
    text-align: right;
    min-width: 0;
  }

  .stats-row.expanded {
    border-bottom: 0;
  }

  .stats-code:last-child {
    border-bottom: 0;
  }

  .stats-code {
    padding: 0.25rem 0 0.5rem;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--bs-border-color-translucent);
  }

  .stats-code-chevron {
    transition: transform 0.2s ease;
  }

  .stats-code-chevron.open {
    transform: rotate(180deg);
  }
</style>

{#if !view}
  <!-- The page's own layout, loading the way the servers modal's cards load: plain `placeholder
       col-N` lines in `placeholder-glow`, the chart areas empty at their real height. -->
  <div class="container vstack gap-3" aria-busy="true">
    <div style="height: 31px;"></div>
    <div class="row g-3 row-cols-1 row-cols-sm-2 row-cols-xl-4">
      {#each Array(4) as _, index (index)}
        <div class="col">
          <div class="card h-100" style="min-height: 160px;">
            <div class="card-body">
              <div class="card-text placeholder-glow">
                <span class="placeholder col-3"></span>
              </div>
              <div class="fs-2 lh-1 placeholder-glow">
                <span class="placeholder col-7 fs-6 align-middle"></span>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    {#each [220, 220] as chartHeight, index (index)}
      <div class="card">
        <div class="card-header py-3">
          <div class="placeholder-glow">
            <span class="placeholder col-3"></span>
          </div>
        </div>
        <div class="card-body">
          <div style="height: {chartHeight}px;"></div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="container vstack gap-3">
    <ServerJavaMissingAlert />

    <!-- §2.4.22 — the server's vitals in the Statistics page's stat-card look: the big value is
         the live sample, the sparkline the last hour (hover for a point). §2.4.23 — the toolbar
         picks how often the sources report while this page is open. -->
    <div class="d-flex flex-wrap justify-content-end align-items-center gap-2">
      <label class="small text-body-secondary mb-0" for="vitalsRange">
        {$_('pages.servers.overview.vitals-range')}
      </label>
      <select
        id="vitalsRange"
        class="form-select form-select-sm w-auto"
        bind:value={vitalsRange}
        on:change={onVitalsRangeChange}>
        {#each VITALS_RANGES as range (range)}
          <option value={range}>{$_(`pages.servers.overview.range-${range}`)}</option>
        {/each}
      </select>
      <label class="small text-body-secondary mb-0" for="vitalsInterval">
        {$_('pages.servers.overview.refresh-interval')}
      </label>
      <select
        id="vitalsInterval"
        class="form-select form-select-sm w-auto"
        bind:value={vitalsInterval}
        on:change={onVitalsIntervalChange}>
        {#each METRIC_REFRESH_INTERVALS as interval (interval)}
          <option value={interval}>{metricRefreshIntervalLabel(interval, $_)}</option>
        {/each}
      </select>
      <!-- A disabled switch swallows pointer events, so the tooltip lives on the wrapper. -->
      <div
        class="form-check form-switch m-0"
        use:tooltip={[serverTimeTooltip, { placement: 'bottom' }]}>
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          id="overviewServerTime"
          bind:checked={useServerTime}
          on:change={onServerTimeChange}
          disabled={!serverTimeZoneAvailable} />
        <label class="form-check-label small" for="overviewServerTime">
          {$_('pages.servers.overview.server-time')}
        </label>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        aria-label={$_('pages.servers.overview.refresh-now')}
        use:tooltip={[$_('pages.servers.overview.refresh-now'), { placement: 'bottom' }]}
        disabled={vitalsRefreshing}
        on:click={refreshVitals}>
        <i class="fa-solid fa-rotate-right" class:fa-spin={vitalsRefreshing} aria-hidden="true"></i>
      </button>
    </div>

    <div class="row g-3 row-cols-1 row-cols-sm-2 row-cols-xl-4">
      <div class="col">
        <ServerVitalCard
          title={$_('pages.servers.overview.vital-cpu')}
          loading={vitalsLoading}
          bucketMs={vitalsBucketMs}
          timeZone={displayTimeZone}
          showDate={vitalsShowDate}
          windowMs={vitalsWindowMs}
          online={vitalsOnline}
          padStart={vitalsRange !== '1m'}
          value={vitals.cpu.value}
          points={vitalSeries.cpu}
          scaleMax={100}
          format={formatPercent}
          colorClass="text-bg-warning" />
      </div>
      <div class="col">
        <ServerVitalCard
          title={$_('pages.servers.overview.vital-ram')}
          loading={vitalsLoading}
          bucketMs={vitalsBucketMs}
          timeZone={displayTimeZone}
          showDate={vitalsShowDate}
          windowMs={vitalsWindowMs}
          online={vitalsOnline}
          padStart={vitalsRange !== '1m'}
          value={vitals.ram.value}
          secondary={vitals.ram.secondary}
          points={vitalSeries.ram}
          scaleMax={vitals.ram.max}
          format={formatByteSize}
          colorClass="text-bg-primary" />
      </div>
      <div class="col">
        <ServerVitalCard
          title={$_('pages.servers.overview.vital-disk')}
          loading={vitalsLoading}
          bucketMs={vitalsBucketMs}
          timeZone={displayTimeZone}
          showDate={vitalsShowDate}
          windowMs={vitalsWindowMs}
          online={vitalsOnline}
          padStart={vitalsRange !== '1m'}
          value={vitals.disk.value}
          secondary={vitals.disk.secondary}
          points={vitalSeries.disk}
          format={formatByteSize}
          colorClass="text-bg-secondary" />
      </div>
      <div class="col">
        <ServerVitalCard
          title={$_('pages.servers.overview.vital-network')}
          loading={vitalsLoading}
          bucketMs={vitalsBucketMs}
          timeZone={displayTimeZone}
          showDate={vitalsShowDate}
          windowMs={vitalsWindowMs}
          online={vitalsOnline}
          padStart={vitalsRange !== '1m'}
          value={vitals.network.value}
          secondary={vitals.network.secondary}
          series={vitalSeries.network}
          format={formatRate}
          valueClass="fs-5"
          colorClass="text-bg-info" />
      </div>
    </div>

    <!-- Live metrics. The strip follows the 10-second sample the plugin pushes; the chart is
         the 1-minute rollup Pano stores, so it survives a page reload. -->
    {#if showPerformance}
      <div class="card">
        <CardHeader>
          <span slot="left" class="d-flex flex-wrap align-items-center column-gap-2">
            {$_('pages.servers.overview.metrics-title')}
            <span class="small text-body-secondary fw-normal">
              {metricsSample
                ? $_('pages.servers.overview.metrics-live')
                : isServerOnline(view)
                  ? $_('pages.servers.overview.metrics-waiting')
                  : $_('pages.servers.overview.metrics-offline')}
            </span>
          </span>
          <!-- §2.4.25 — an hour of minutes, a day of ten-minute buckets, a week day by day. -->
          <CardFilters slot="right">
            {#each PERFORMANCE_RANGE_KEYS as key (key)}
              <CardFiltersItem
                button
                active={performanceRange === key}
                onclick={() => setPerformanceRange(key)}>
                {$_(`pages.servers.overview.performance-range-${key}`)}
              </CardFiltersItem>
            {/each}
          </CardFilters>
        </CardHeader>
        <div class="card-body vstack gap-3">
          <div class="row g-3">
            <!-- §6 — a tick counter the software can never have (a proxy counts no ticks) is not
                 shown at all; a "—" that is only empty for now (§2.4.35) says why. -->
            {#if showTps}
              <div class={metricTileColumn}>
                <div
                  class="metric-tile p-3 h-100"
                  use:tooltip={[
                    tpsUnavailableReason
                      ? $_(tpsUnavailableReason, {
                          values: { section: $_(featureSectionKey('metrics.tps')) },
                        })
                      : '',
                    { placement: 'top' },
                  ]}>
                  <div class="small text-body-secondary">
                    {$_('pages.servers.overview.tps-triple')}
                  </div>
                  {#if performanceWaiting}
                    <div class="fs-5 placeholder-glow">
                      <span class="placeholder col-8 fs-6 align-middle"></span>
                    </div>
                  {:else}
                    <div class="fs-5 fw-bold font-monospace text-nowrap {tps.class}">
                      {tps.text}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}

            <div class={metricTileColumn}>
              <div class="metric-tile p-3 h-100">
                <div class="small text-body-secondary d-flex align-items-center gap-1">
                  {$_('pages.servers.overview.mspt')}
                  <i
                    class="fa-solid fa-circle-info opacity-75"
                    role="img"
                    aria-label={$_('pages.servers.overview.mspt-info')}
                    use:tooltip={[$_('pages.servers.overview.mspt-info'), { placement: 'top' }]}
                  ></i>
                </div>
                {#if performanceWaiting}
                  <div class="fs-4 placeholder-glow">
                    <span class="placeholder col-6 fs-6 align-middle"></span>
                  </div>
                {:else}
                  <div class="fs-4 fw-bold font-monospace {mspt.class}">{mspt.text}</div>
                {/if}
              </div>
            </div>

            <div class={metricTileColumn}>
              <div class="metric-tile p-3 h-100">
                <div class="small text-body-secondary">
                  {$_('pages.servers.overview.players-online')}
                </div>
                {#if performanceWaiting}
                  <div class="fs-4 placeholder-glow">
                    <span class="placeholder col-5 fs-6 align-middle"></span>
                  </div>
                {:else}
                  <div class="fs-4 fw-bold font-monospace">{playersText}</div>
                {/if}
              </div>
            </div>
            <div class={metricTileColumn}>
              <div class="metric-tile p-3 h-100">
                <div class="small text-body-secondary">{$_('pages.servers.overview.uptime')}</div>
                {#if performanceWaiting}
                  <div class="fs-4 placeholder-glow">
                    <span class="placeholder col-7 fs-6 align-middle"></span>
                  </div>
                {:else}
                  <div class="fs-4 fw-bold font-monospace">{uptimeText}</div>
                {/if}
              </div>
            </div>
          </div>

          {#if metricsLoading}
            <!-- The chart's own height (ServerMetricsChart is 220 px tall). -->
            <div class="placeholder-glow" style="height: 220px;" aria-busy="true">
              <span class="placeholder col-4"></span>
            </div>
          {:else}
            <!-- Drawn with no data too: a range nothing was measured in reads as zero. -->
            <ServerMetricsChart
              series={perfSeries}
              bucketMs={PERFORMANCE_RANGES[performanceRange].bucketMs}
              range={PERFORMANCE_RANGES[performanceRange].range}
              online={isServerOnline(view)}
              tpsSupported={showTps}
              timeZone={displayTimeZone} />
          {/if}
        </div>
      </div>
    {:else}
      <!-- Nothing can report performance for this server right now. The card stays, disabled,
           and says why — the same reason the other pages give (§2.4.35), with the update button
           when a newer Pano plugin is what it takes. -->
      <div class="card" aria-disabled="true">
        <CardHeader>
          <span slot="left" class="d-flex flex-wrap align-items-center column-gap-2">
            {$_('pages.servers.overview.metrics-title')}
            <span class="small text-body-secondary fw-normal">
              {$_('pages.servers.overview.metrics-unavailable')}
            </span>
          </span>
        </CardHeader>
        <div class="card-body vstack gap-3">
          <ServerCapabilityNotice
            server={view}
            feature={performanceFeature}
            section="pages.servers.overview.metrics-title" />
          <div class="row g-3 opacity-50" aria-hidden="true">
            {#each performanceTileLabels as label (label)}
              <div class={performanceTileLabels.length === 4 ? 'col-6 col-lg-3' : 'col-6 col-lg-4'}>
                <div class="metric-tile p-3 h-100">
                  <div class="small text-body-secondary">{$_(label)}</div>
                  <div class="fs-4 fw-bold font-monospace text-body-secondary">—</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Server Activity: peak and average players per day, the Overview's counterpart to the
         Statistics page's Website Activity card (§2.4.19). -->
    <div class="card">
      <CardHeader>
        <span slot="left">{$_('pages.servers.overview.activity-chart-title')}</span>
        <CardFilters slot="right">
          <CardFiltersItem
            href="/servers/{view.id}?period={ServerActivityPeriod.HOUR}"
            active={data.period === ServerActivityPeriod.HOUR}>
            {$_('pages.servers.overview.activity-chart-hour')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/servers/{view.id}?period={ServerActivityPeriod.DAY}"
            active={data.period === ServerActivityPeriod.DAY}>
            {$_('pages.servers.overview.activity-chart-day')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/servers/{view.id}?period={ServerActivityPeriod.WEEK}"
            active={data.period === ServerActivityPeriod.WEEK}>
            {$_('pages.servers.overview.activity-chart-week')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/servers/{view.id}?period={ServerActivityPeriod.MONTH}"
            active={data.period === ServerActivityPeriod.MONTH}>
            {$_('pages.servers.overview.activity-chart-month')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/servers/{view.id}?period={ServerActivityPeriod.YEAR}"
            active={data.period === ServerActivityPeriod.YEAR}>
            {$_('pages.servers.overview.activity-chart-year')}
          </CardFiltersItem>
        </CardFilters>
      </CardHeader>

      <!-- Inside the padded body, like the Performance chart below it. -->
      <div class="card-body">
        {#if activityChartLoading}
          <!-- Another Week / Month / Year is on its way; the chart's own height meanwhile. -->
          <div class="placeholder-glow" style="height: 220px;" aria-busy="true">
            <span class="placeholder col-4"></span>
          </div>
        {:else}
          {#key data.period}
            <ServerActivityChart
              peakPlayerData={data.peakPlayerData}
              averagePlayerData={data.averagePlayerData}
              period={data.period}
              timeZone={displayTimeZone} />
          {/key}
        {/if}
      </div>
    </div>

    <!-- Recent activity and the mini console share a row on wide screens and stack below `lg`;
         whichever is alone takes the whole row.

         Recent activity: the newest few entries of the same log the settings tab pages through
         (§2.4.12). Details are untrusted text and are rendered as text, never as HTML. -->
    {#if showRecentActivity || showConsole}
      <div class="row g-3">
        {#if showConsole}
          <div class="col-12" class:col-lg-6={showRecentActivity}>
            <!-- Mini console: the tail of the live stream plus the command line. History, search,
               older lines, copy and the view switches live on the console page. -->
            <div class="card h-100">
              <CardHeader>
                <span slot="left" class="d-flex align-items-center gap-2">
                  {$_('pages.servers.overview.console-title')}
                  {#if consoleSourceLabel}
                    <i
                      class="{consoleSourceIcon(consoleSource)} text-body-secondary small"
                      role="img"
                      aria-label={$_(consoleSourceLabel)}
                      use:tooltip={[$_(consoleSourceLabel), { placement: 'bottom' }]}></i>
                  {/if}
                </span>
                <span slot="right">
                  <a
                    class="btn btn-sm btn-outline-secondary"
                    href="{base}/servers/{view.id}/console">
                    <i class="fa-solid fa-terminal me-1" aria-hidden="true"></i>
                    {$_('pages.servers.overview.console-open')}
                  </a>
                </span>
              </CardHeader>

              {#if consoleAvailable}
                <div class="mini-console flex-grow-1 d-flex flex-column">
                  {#if consoleHydratedId !== viewId}
                    <!-- A few lines' worth of placeholder in the dark box, as tall as the view. -->
                    <!-- `text-light` only so the placeholders show on the dark ground. -->
                    <div class="text-light px-3 py-2" style="height: 320px;" aria-busy="true">
                      {#each [7, 5, 9, 6, 4, 8, 5] as width, index (index)}
                        <div class="placeholder-glow">
                          <span class="placeholder col-{width}"></span>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <ServerConsoleView
                      entries={consoleEntries}
                      showTimestamps={false}
                      wrap
                      flush
                      height="320px"
                      showReachedStart={false}
                      bind:following={consoleFollowing}
                      ariaLabel={$_('pages.servers.overview.console-title')}
                      emptyText={$_('pages.servers.console.empty')} />
                  {/if}
                  <div class="mt-auto">
                    <ServerConsoleCommandBar server={view} serverId={viewId} />
                  </div>
                </div>
              {:else}
                <div class="card-body">
                  <ServerCapabilityNotice
                    server={view}
                    feature="console.stream"
                    section="components.server-navigation-menu.console" />
                </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if showRecentActivity}
          <div class="col-12" class:col-lg-6={showConsole}>
            <div class="card h-100">
              <CardHeader>
                <span slot="left">{$_('pages.servers.overview.activity-title')}</span>
                <span slot="right">
                  <a
                    class="btn btn-sm btn-outline-secondary"
                    href="{base}/servers/{view.id}/settings/activity">
                    <i class="fa-solid fa-clock-rotate-left me-1" aria-hidden="true"></i>
                    {$_('pages.servers.overview.activity-open')}
                  </a>
                </span>
              </CardHeader>

              <!-- As tall as the console card next to it (its 320 px log plus the command line):
                   the list scrolls inside instead of growing the card, whatever it holds. -->
              <div class="activity-scroll">
                <div class="activity-scroll-inner">
                  {#if activityLoading}
                    <!-- Rows shaped like an entry: badge, name, time, then the detail line. -->
                    <div class="list-group list-group-flush" aria-busy="true">
                      {#each Array(RECENT_ACTIVITY_ENTRIES) as _, index (index)}
                        <div class="list-group-item">
                          <div class="d-flex gap-2 placeholder-glow">
                            <span class="placeholder col-2"></span>
                            <span class="placeholder col-3"></span>
                            <span class="placeholder col-2 ms-auto"></span>
                          </div>
                          <div class="small mt-1 placeholder-glow">
                            <span class="placeholder col-7"></span>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else if recentActivity.length === 0}
                    <div class="card-body">
                      <NoContent
                        icon="fa-solid fa-clock-rotate-left fa-3x"
                        text={$_('pages.servers.activity.empty')} />
                    </div>
                  {:else}
                    <div class="list-group list-group-flush">
                      {#each recentActivity as entry (entry.id)}
                        <ServerActivityEntry {entry} fresh={freshActivityIds.has(entry.id)} />
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Everything Pano knows about this server, grouped and packed into columns: a group
         appears only where it applies — the runtime of a process Pano owns, the plugin of a
         server that has one — and a value nobody reported reads "—". -->
    <div class="card">
      <CardHeader>
        <span slot="left">{$_('pages.servers.overview.statistics')}</span>
      </CardHeader>
      <div class="card-body stats-columns">
        {#each statGroups as group (group.key)}
          <section class="stats-group">
            <h6 class="stats-group-title text-body-secondary text-uppercase small fw-semibold">
              {$_(group.title)}
            </h6>
            {#each group.rows as row (row.key)}
              <div
                class="stats-row"
                class:expanded={row.collapsible && shownCodeRows.includes(row.key)}>
                <span class="stats-label text-body-secondary">{$_(row.label)}</span>
                <span class="stats-value text-break" class:font-monospace={row.mono}>
                  {#if row.kind === 'date'}
                    {#if Number(row.time) > 0}
                      <DateComponent time={row.time} />
                    {:else}
                      —
                    {/if}
                  {:else if row.kind === 'uuid'}
                    <span class="d-inline-flex align-items-center gap-2">
                      <code>{row.text}</code>
                      <button
                        type="button"
                        class="btn btn-sm btn-link p-0"
                        aria-label={$_('buttons.copy')}
                        use:tooltip={[
                          uuidCopied
                            ? $_('components.modals.connect-server.copied')
                            : $_('buttons.copy'),
                          { placement: 'top', hideOnClick: false },
                        ]}
                        on:click={() => copyUuid(row.text)}>
                        <i class="fa-regular fa-copy" aria-hidden="true"></i>
                      </button>
                    </span>
                  {:else if row.kind === 'code' && row.collapsible}
                    <button
                      type="button"
                      class="btn btn-sm btn-link p-0 text-decoration-none"
                      aria-expanded={shownCodeRows.includes(row.key)}
                      aria-controls="stats-code-{group.key}-{row.key}"
                      on:click={() => toggleCodeRow(row.key)}>
                      {shownCodeRows.includes(row.key)
                        ? $_('pages.servers.overview.info.code-hide')
                        : $_('pages.servers.overview.info.code-show', {
                            values: { count: row.count },
                          })}
                      <i
                        class="fa-solid fa-chevron-down ms-1 stats-code-chevron"
                        class:open={shownCodeRows.includes(row.key)}
                        aria-hidden="true"></i>
                    </button>
                  {:else if row.kind === 'code'}
                    <code class="text-break">{row.text}</code>
                  {:else if row.kind === 'plugin-version'}
                    <span
                      class="d-inline-flex flex-wrap align-items-center justify-content-end gap-2">
                      {row.text}
                      <!-- §2.4.26 — only when Pano knows what it would install; a dev or local
                           build has no comparable version, so it gets no badge at all. -->
                      {#if data.panoPlugin?.updateAvailable === true}
                        <span class="badge text-bg-warning">
                          {$_('pages.servers.overview.info.plugin-update-available', {
                            values: { version: data.panoPlugin.latestVersion ?? '' },
                          })}
                        </span>
                        {#if data.panoPlugin?.updateMode || data.panoPlugin?.updateManual}
                          <!-- One click: the node swaps the jar, or the plugin stages its own
                               update; either way it loads on the next restart. A plugin too old
                               for either gets the hand-update steps instead. -->
                          <PanoPluginUpdateButton
                            server={view}
                            latestVersion={data.panoPlugin.latestVersion ?? null}
                            label="buttons.update"
                            class="py-0" />
                        {/if}
                      {:else if data.panoPlugin?.updateAvailable === false}
                        <span class="badge text-bg-success">
                          {$_('pages.servers.overview.info.plugin-up-to-date')}
                        </span>
                      {/if}
                    </span>
                  {:else if row.kind === 'capabilities'}
                    {#if Array.isArray(view.capabilities) && view.capabilities.length}
                      <span class="d-inline-flex justify-content-end">
                        <ServerCapabilityChips server={view} />
                      </span>
                    {:else}
                      —
                    {/if}
                  {:else if row.kind === 'last-backup'}
                    {#if lastBackup}
                      <span
                        class="d-inline-flex flex-wrap align-items-center justify-content-end gap-2">
                        <DateComponent time={lastBackup.time} />
                        {#if lastBackup.name}
                          <span class="small text-body-secondary text-break"
                            >{lastBackup.name}</span>
                        {/if}
                        <a class="small" href="{base}/servers/{view.id}/backups">
                          {$_('pages.servers.overview.last-backup-open')}
                        </a>
                      </span>
                    {:else}
                      —
                    {/if}
                  {:else}
                    {row.text}
                  {/if}
                </span>
              </div>
              {#if row.collapsible && shownCodeRows.includes(row.key)}
                <!-- Below the row, full width: a long argument list reads badly squeezed into
                     the value column. -->
                <div class="stats-code" id="stats-code-{group.key}-{row.key}">
                  <code class="text-break">{row.text}</code>
                </div>
              {/if}
            {/each}
          </section>
        {/each}
      </div>
    </div>
  </div>
{/if}

<script context="module">
  import { browser } from '$app/environment';

  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { PANEL_SERVER_LIVE_LOAD_KEY } from '$lib/panelRealtime.js';
  import { fetchConsoleHistory } from '$lib/serverConsole.util.js';

  /** How many lines the mini console opens with; the full history lives on the console page. */
  const MINI_CONSOLE_HISTORY_LINES = 100;

  /**
   * The server whose console history this page already has in the browser. `load` re-runs on
   * every realtime server frame (PANEL_SERVER_LIVE_LOAD_KEY), and the mini console only ever
   * applies its history once per server — so the re-runs skip a request that would otherwise
   * read the log files again for nothing. Only ever set in the browser: on the server the
   * module is shared by every request. Cleared when the page goes away.
   *
   * @type {string | null}
   */
  let consoleHistoryLoadedFor = null;

  /**
   * The two ranges the Server Activity card offers, with the same ids the Statistics page puts
   * in its query string (§2.4.19).
   */
  export const ServerActivityPeriod = Object.freeze({
    // §2.4.26 — the last hour by minute and the last day by hour.
    HOUR: 'HOUR',
    DAY: 'DAY',
    WEEK: 'WEEK',
    MONTH: 'MONTH',
    // §2.4.24 — 13 month buckets from the daily rollup.
    YEAR: 'YEAR',
  });

  /**
   * @param {string | null} value
   */
  function normalizeActivityPeriod(value) {
    const period = String(value || '').toUpperCase();

    return Object.values(ServerActivityPeriod).includes(period)
      ? period
      : ServerActivityPeriod.WEEK;
  }

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params, depends, url } = event;

    depends(PANEL_SERVER_LIVE_LOAD_KEY);

    await parent();

    const period = normalizeActivityPeriod(url.searchParams.get('period'));
    const wantsConsoleHistory = !browser || consoleHistoryLoadedFor !== String(params.id);

    const [dashboard, activityChart, consoleHistory] = await Promise.all([
      ApiUtil.get({
        path: `/api/panel/servers/${params.id}/dashboard`,
        request: event,
      }),
      ApiUtil.get({
        path: `/api/panel/servers/${params.id}/activity-chart` + buildQueryParams({ period }),
        request: event,
        handler: (response) => response,
      }),
      // Never throws: an offline server, a source that cannot tap the log or a missing
      // permission all come back as a status, and the mini console simply opens empty.
      wantsConsoleHistory
        ? fetchConsoleHistory({
            serverId: params.id,
            limit: MINI_CONSOLE_HISTORY_LINES,
            request: event,
          })
        : Promise.resolve(null),
    ]);

    // The chart is an extra, never a reason for the page to fail: a backend without the
    // endpoint answers 404 and the card simply draws empty.
    const chart =
      activityChart && typeof activityChart === 'object' && !activityChart.error
        ? activityChart
        : {};

    return {
      ...dashboard,
      period,
      peakPlayerData: chart.peakPlayerData ?? {},
      averagePlayerData: chart.averagePlayerData ?? {},
      consoleHistory,
    };
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { navigating, page } from '$app/stores';

  // `browser`, `ApiUtil` and `PANEL_SERVER_LIVE_LOAD_KEY` already come from the module script.
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import {
    FEATURE_REASON_KEYS,
    FeatureReasons,
    featureSectionKey,
    featureSource,
    featureUnavailableReason,
    getLocalAddress,
    hasCapability,
    hasFeature,
    isAgentServer,
    isFeatureNotSupported,
    isInPlace,
    isManaged,
    isServerOnline,
    ServerCapabilities,
  } from '$lib/servers.util.js';
  import {
    appendConsoleLines,
    CONSOLE_SOURCE_LABELS,
    consoleSourceIcon,
    consoleStreamSource,
  } from '$lib/serverConsole.util.js';
  import { fetchServerActivity } from '$lib/serverActivity.util.js';
  import {
    onServerActivity,
    onServerConsole,
    onServerMetrics,
    setServerMetricsInterval,
    subscribeServerConsole,
    subscribeServerMetrics,
  } from '$lib/panelRealtime.js';
  import tooltip from '$lib/tooltip.util';
  import copy from 'copy-to-clipboard';
  import ServerCapabilityChips from '$lib/components/servers/ServerCapabilityChips.svelte';

  import CardFilters from '$lib/components/CardFilters.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import ServerActivityChart from '$lib/components/charts/Server/ServerActivityChart.svelte';
  import ServerActivityEntry from '$lib/components/servers/ServerActivityEntry.svelte';
  import ServerMetricsChart from '$lib/components/charts/Server/ServerMetricsChart.svelte';
  import ServerVitalCard from '$lib/components/charts/Server/ServerVitalCard.svelte';
  import { formatBytes as formatByteSize } from '$lib/string.util.js';
  import {
    isValidTimeZone,
    loadMetricRefreshInterval,
    METRIC_REFRESH_INTERVAL_DEFAULT,
    METRIC_REFRESH_INTERVALS,
    metricRefreshIntervalLabel,
    metricRequestInterval,
    storeMetricRefreshInterval,
    createLatestThrottle,
    METRIC_RANGE_BUCKET_MS,
    METRIC_RANGE_WINDOW_MS,
  } from '$lib/metricsSeries.util.js';
  import ServerCapabilityNotice from '$lib/components/servers/ServerCapabilityNotice.svelte';
  import PanoPluginUpdateButton from '$lib/components/servers/PanoPluginUpdateButton.svelte';
  import ServerConsoleCommandBar from '$lib/components/servers/ServerConsoleCommandBar.svelte';
  import ServerConsoleView from '$lib/components/servers/ServerConsoleView.svelte';
  import ServerJavaMissingAlert from '$lib/components/servers/ServerJavaMissingAlert.svelte';
  import { isServerNavItemVisible } from '$lib/components/sidebar/ServerNavigationMenu.svelte';

  export let data;

  /** How many log entries the "Recent activity" card shows before linking to the full tab. */
  const RECENT_ACTIVITY_ENTRIES = 10;

  /** The 1-minute vitals window is live: its cards move every second whatever the interval is. */
  const LIVE_RANGE_INTERVAL = 1000;
  const VITALS_INTERVAL_KEY = 'pano.panel.server-overview.vitals-interval';
  /** The most live points a sparkline ever holds (two a second for an hour). */
  const VITALS_MAX_POINTS = 7200;

  /**
   * §2.4.25 — the windows the vital sparklines can show. `1m` is drawn from live samples alone;
   * the others start from the stored series and keep the live samples inside the window.
   */
  const VITALS_RANGES = Object.freeze(['1m', '1h', '12h', '24h', '7d', '30d']);
  const VITALS_RANGE_DEFAULT = '1m';
  const VITALS_RANGE_KEY = 'pano.panel.server-overview.vitals-range';
  /** Ranges long enough that a tooltip needs the day as well as the time. */
  const VITALS_DATED_RANGES = Object.freeze(['24h', '7d', '30d']);
  const SERVER_TIME_KEY = 'pano.panel.server-overview.server-time';

  /** Reasons that only say the server is not up right now; the Performance card shows N/A for them. */
  const STATE_REASON_KEYS = [
    FEATURE_REASON_KEYS[FeatureReasons.SERVER_STOPPED],
    FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_NOT_CONNECTED],
    FEATURE_REASON_KEYS[FeatureReasons.NODE_OFFLINE],
  ];

  /** Software that forwards players rather than running a world: no ticks, so no TPS or MSPT. */
  const PROXY_TYPES = ['VELOCITY', 'BUNGEECORD', 'WATERFALL'];

  /** §2.4.25 — the Performance card's Hour / Day / Week, as the query and bucket each maps to. */
  const PERFORMANCE_RANGES = Object.freeze({
    hour: { range: '1h', query: 'range=1h', bucketMs: 60_000 },
    day: { range: '24h', query: 'range=24h', bucketMs: 600_000 },
    week: { range: '7d', query: 'range=7d&bucket=day', bucketMs: 86_400_000 },
  });
  const PERFORMANCE_RANGE_KEYS = Object.freeze(['hour', 'day', 'week']);

  /** The mini console is a tail, not a log viewer: older lines fall off above this. */
  const MINI_CONSOLE_MAX_LINES = 300;

  /**
   * The mini console shows where the console page's sidebar link would: the admin may use the
   * console and the server has (or could have) something to stream.
   */
  const CONSOLE_CARD_ITEM = Object.freeze({
    permission: Permissions.MANAGE_SERVER_CONSOLE,
    feature: 'console.stream',
  });

  const server = getContext('server');

  // The dashboard payload carries the activity series; the context store is the one the
  // realtime frames update, so it wins for status, player count and capabilities.
  $: view = data.server ? { ...data.server, ...($server || {}) } : $server;

  /** @type {object | null} the latest 10-second metrics sample. */
  let metricsSample = null;
  /**
   * @type {Array<{ ts: number, tps: number|null, players: number|null, cpu: number|null,
   *   mem: number|null, disk: number|null, netRx: number|null, netTx: number|null }>}
   */
  let metricsSeries = [];
  let metricsLoading = true;
  let uuidCopied = false;

  /** The statistics rows whose long value (the JVM arguments) is opened below them. */
  /** @type {string[]} */
  let shownCodeRows = [];

  /** @param {string} key */
  function toggleCodeRow(key) {
    shownCodeRows = shownCodeRows.includes(key)
      ? shownCodeRows.filter((shown) => shown !== key)
      : [...shownCodeRows, key];
  }
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let uuidCopiedTimer;

  /** Until the vitals' first fetch answers, the cards show placeholders instead of "—". */
  let vitalsLoading = true;
  /**
   * What the Performance card shows — its tiles and its chart. Like the vitals it follows the
   * live feed except while the refresh interval is Paused, and an explicit fetch (a range switch,
   * "Refresh now") always reaches it.
   *
   * @type {object | null}
   */
  let perfSample = null;
  /** @type {typeof metricsSeries} */
  let perfSeries = [];
  /**
   * §2.4.23 — what the vital cards draw. It follows `metricsSample`/`vitalsData` except while
   * the refresh interval is Paused, when it keeps the last picture until the admin changes it.
   *
   * @type {object | null}
   */
  let vitalsSample = null;
  /** @type {typeof metricsSeries} */
  let vitalsSeries = [];
  /** The window the vital sparklines show; remembered per browser. */
  let vitalsRange = browser
    ? loadStoredChoice(VITALS_RANGE_KEY, VITALS_RANGES, VITALS_RANGE_DEFAULT)
    : VITALS_RANGE_DEFAULT;
  /** Milliseconds between Performance (and non-1-minute vitals) updates; 0 is Paused. */
  let vitalsInterval = browser
    ? loadMetricRefreshInterval(VITALS_INTERVAL_KEY)
    : METRIC_REFRESH_INTERVAL_DEFAULT;
  let vitalsRefreshing = false;
  /** When the Performance card last took a live sample; see the frame handler. */
  /**
   * At most one update of the displayed "now" figures per chosen interval, always with the
   * newest sample received (a trailing update closes each interval).
   */
  const vitalsThrottle = createLatestThrottle((sample) => {
    vitalsSample = sample;
  });
  const perfThrottle = createLatestThrottle((sample) => {
    perfSample = sample;
    perfSeries = metricsSeries;
  });
  /**
   * The vitals' own series: the stored window plus the live samples inside it. The Performance
   * chart has its own (`metricsSeries`), because the two pick their ranges independently.
   *
   * @type {typeof metricsSeries}
   */
  let vitalsData = [];
  /** Show times in the server's time zone rather than the browser's; remembered per browser. */
  let useServerTime = browser ? loadServerTimeChoice() : false;
  /** @type {'hour' | 'day' | 'week'} */
  let performanceRange = 'hour';
  /** Bumped by every fetch, so a slow answer for an older range never overwrites a newer one. */
  let vitalsGeneration = 0;
  let performanceGeneration = 0;
  let wiredId = null;
  /** Whether [wire] last ran with the metrics feed, so their arrival later wires it again. */
  let wiredWithMetrics = false;
  /** @type {object[]} the newest few activity-log entries (§2.4.12). */
  let recentActivity = [];
  let activityLoading = true;
  let activityStatus = 'ok';
  let activityWiredId = null;
  /** Ids of entries that arrived live, highlighted briefly. */
  let freshActivityIds = new Set();
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let activityRefreshTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let freshActivityTimer;
  /** Set by `onDestroy`: a hydrate still in flight must not write to a dead page. */
  let destroyed = false;
  /** @type {Array<() => void>} everything [wire] has to undo. */
  let releases = [];
  /** @type {import('$lib/serverConsole.util.js').ConsoleEntry[]} the mini console's tail. */
  let consoleEntries = [];
  /** Follows the tail; the view turns it off while the reader is scrolled up. */
  let consoleFollowing = true;
  /** The server whose history is in [consoleEntries]; it is applied once per server. */
  let consoleHydratedId = null;
  let consoleWiredId = null;
  /** @type {(() => void) | null} undoes the console feed. */
  let releaseConsoleFeed = null;

  $: viewId = view?.id ?? null;

  // The history `load` fetched, applied once per server. First on purpose: it writes
  // `consoleEntries` from inside a function, which the legacy reactivity cannot see as a
  // dependency, so anything reading it has to come after.
  $: hydrateConsole(data, viewId);

  $: showConsole = !!view && isServerNavItemVisible(CONSOLE_CARD_ITEM, view);
  $: consoleAvailable = hasFeature(view, 'console.stream');
  $: consoleSource = consoleStreamSource(view);
  $: consoleSourceLabel = CONSOLE_SOURCE_LABELS[consoleSource] || '';

  // The stream is per server, so it follows the id rather than the mount.
  $: if (browser && viewId != null && showConsole && consoleWiredId !== viewId) {
    consoleWiredId = viewId;
    wireConsole(viewId);
  }
  // The statistics card, as groups of rows. Built here rather than in the markup so a row
  // that does not apply (the runtime of a linked server, the plugin of one that never had it)
  // is simply not in the list, and the columns pack whatever is.
  $: statGroups = buildStatGroups(view, data, $_);
  // SM-33 — the dashboard payload carries the newest backup once the backend has one; until
  // then (and for a linked server, which has no node to back up) the row is simply absent.
  $: lastBackup =
    isManaged(view) && hasPermission(Permissions.MANAGE_SERVER_BACKUPS)
      ? normalizeLastBackup(data?.lastBackup ?? view?.lastBackup)
      : null;
  // §2.4.22 — the vitals need the feed whoever measures: the plugin (heap, TPS) or the node
  // (process CPU/RSS, disk, network) for a server that has no plugin metrics of its own.
  $: wantsMetrics =
    hasCapability(view, ServerCapabilities.METRICS) || hasFeature(view, 'metrics.memory');
  // A build that predates the log answers `unavailable`, and an admin who cannot read it never
  // asked — in both cases the card stays away instead of showing an error nobody can act on.
  $: showRecentActivity =
    hasPermission(Permissions.MANAGE_SERVERS) &&
    (activityLoading || activityStatus === 'ok') &&
    !!view;

  // The tiles show placeholders only while the first fetch is out and no sample has arrived; a
  // server that never answers ends up with "—", not an endless skeleton.
  // Only while a fetch can still bring something: a server with nothing to report (stopped, no
  // plugin connected) shows its N/A at once instead of a skeleton that never resolves.
  $: performanceWaiting = metricsLoading && wantsMetrics && !perfSample;
  // A period switch navigates to this same page; the old chart would otherwise sit there
  // looking current until the new data lands.
  $: activityChartLoading =
    !!$navigating &&
    $navigating.to?.url?.pathname === $page.url.pathname &&
    ($navigating.to?.url?.searchParams.get('period') ?? '') !==
      ($page.url.searchParams.get('period') ?? '');

  $: tps = describeTps(isServerOnline(view) ? perfSample : null);
  // §6 — never on a proxy or a software without a Pano plugin: hidden, and the other three tiles
  // share the row.
  $: showTps = !isFeatureNotSupported(view, 'metrics.tps');
  // The feature the disabled Performance card explains itself with: the tick counter — what only a
  // Pano plugin reports, so software without one (vanilla) is told so — except on a proxy, which
  // counts no ticks at all but does report its players.
  $: performanceFeature = PROXY_TYPES.includes(String(view?.type || '').toUpperCase())
    ? 'metrics.players'
    : 'metrics.tps';
  // The card shows whenever the numbers can come once the server runs — stopped, not connected
  // yet, node away: its tiles read N/A like any quiet moment. Only a reason no restart fixes (the
  // software has no Pano plugin, the plugin is too old or lacks metrics) turns it into the
  // disabled card that says so.
  $: performanceReason = hasCapability(view, ServerCapabilities.METRICS)
    ? ''
    : featureUnavailableReason(view, performanceFeature);
  $: showPerformance = !performanceReason || STATE_REASON_KEYS.includes(performanceReason);
  $: performanceTileLabels = [
    ...(showTps ? ['pages.servers.overview.tps-triple'] : []),
    'pages.servers.overview.mspt',
    'pages.servers.overview.players-online',
    'pages.servers.overview.uptime',
  ];
  $: metricTileColumn = showTps ? 'col-6 col-lg-3' : 'col-6 col-lg-4';
  $: tpsUnavailableReason =
    featureSource(view, 'metrics.tps') === null
      ? featureUnavailableReason(view, 'metrics.tps')
      : '';
  $: mspt = describeMspt(isServerOnline(view) ? perfSample : null);
  $: vitals = describeVitals($_, isServerOnline(view) ? vitalsSample : null, view);
  // Players from the live sample (it moves every tick), the server row otherwise.
  $: playersText = describePlayers(isServerOnline(view) ? perfSample : null, view);
  // The process start on the node for a managed server, the plugin's reported boot time for a
  // linked one; counted up every second while the server is up.
  $: uptimeStart = Number(view?.processStartedAt) || Number(view?.startTime) || 0;
  $: uptimeText = describeUptime(uptimeStart, isServerOnline(view), uptimeNow);

  $: vitalSeries = buildVitalSeries($_, vitalsSeries, vitalsSample);

  // §2.4.25 — a stretch with no sample longer than 2.5 of these drops to zero. On `1m` the
  // points are the live samples, so their spacing is the refresh interval.
  $: vitalsBucketMs =
    vitalsRange === '1m'
      ? requestedMetricsInterval(vitalsInterval)
      : (METRIC_RANGE_BUCKET_MS[vitalsRange] ?? 60_000);
  $: vitalsShowDate = VITALS_DATED_RANGES.includes(vitalsRange);
  // Every range is drawn over its whole span, `1m` scrolling like a live chart: a day is a day
  // whatever the data covers, and what nothing measured in it reads as zero.
  $: vitalsWindowMs = METRIC_RANGE_WINDOW_MS[vitalsRange] ?? null;
  // Off, the cards draw zero from the last sample to now; on, that stretch is only not here yet.
  $: vitalsOnline = isServerOnline(view);
  $: serverTimeZoneAvailable = isValidTimeZone(view?.timeZone);
  $: displayTimeZone = useServerTime && serverTimeZoneAvailable ? view.timeZone : undefined;
  $: serverTimeTooltip = serverTimeZoneAvailable
    ? $_('pages.servers.overview.server-time-zone', { values: { zone: view.timeZone } })
    : $_('pages.servers.overview.server-time-unavailable');

  // Wired again when the metrics turn up after the page opened: a server that was stopped then
  // has nothing that measures it, and once it starts the vitals and Performance must subscribe
  // instead of staying empty until a reload. Not unwired when they go away again: the feed
  // simply goes quiet, and picks up again on the next start.
  $: if (browser && viewId != null && (wiredId !== viewId || (wantsMetrics && !wiredWithMetrics))) {
    wiredId = viewId;
    wiredWithMetrics = wantsMetrics;
    void wire(viewId);
  }

  // The card hides itself on a build without the endpoint, so it only appears once the log has
  // actually answered — `showRecentActivity` follows `activityStatus`, not the permission alone.
  $: if (browser && viewId != null && activityWiredId !== viewId) {
    activityWiredId = viewId;
    void hydrateActivity(viewId);
  }

  /**
   * The newest few entries of this server's log.
   *
   * @param {number} id
   */
  async function hydrateActivity(id) {
    recentActivity = [];
    activityLoading = true;

    if (!hasPermission(Permissions.MANAGE_SERVERS)) {
      activityStatus = 'unavailable';
      activityLoading = false;

      return;
    }

    const result = await fetchServerActivity({
      serverId: id,
      limit: RECENT_ACTIVITY_ENTRIES,
    });

    if (destroyed || activityWiredId !== id) {
      return;
    }

    activityStatus = result.status;
    recentActivity = result.entries.slice(0, RECENT_ACTIVITY_ENTRIES);
    activityLoading = false;
  }

  /**
   * The newest backup as the dashboard reports it: an object with a name and a timestamp, or
   * just a timestamp. Anything else (including a backend that does not send it yet) is null.
   *
   * @param {unknown} value
   * @returns {{ time: number | string, name: string } | null}
   */
  function normalizeLastBackup(value) {
    if (value == null || value === '') {
      return null;
    }

    if (typeof value === 'number' || typeof value === 'string') {
      return { time: value, name: '' };
    }

    const backup = /** @type {Record<string, unknown>} */ (value);
    const time = backup.createdAt ?? backup.time ?? null;

    if (time == null || time === '') {
      return null;
    }

    return {
      time: typeof time === 'number' ? time : String(time),
      name: String(backup.name || ''),
    };
  }

  /**
   * Attach the overview to the same metrics feed the dedicated pages use.
   *
   * The history is fetched and the feed joined whatever the server's state: a stopped server
   * still has its last hour to show (ending in the drop to zero), and a feed joined now is what
   * carries the first sample the moment it starts.
   *
   * @param {number} id
   */
  async function wire(id) {
    unwire();

    metricsSample = null;
    metricsSeries = [];
    vitalsData = [];
    vitalsSample = null;
    vitalsSeries = [];
    perfSample = null;
    perfSeries = [];
    metricsLoading = true;
    vitalsLoading = true;

    releases.push(
      onServerMetrics((frame) => {
        if (Number(frame.serverId) !== Number(id) || !frame.sample) {
          return;
        }

        metricsSample = frame.sample;
        vitalsData = appendSample(
          vitalsData,
          frame.sample,
          METRIC_RANGE_WINDOW_MS[vitalsRange],
          vitalsRange === '1m' ? 0 : METRIC_RANGE_BUCKET_MS[vitalsRange],
        );

        // Live samples only bridge the Hour view; the Day and Week buckets are what they are.
        if (performanceRange === 'hour') {
          metricsSeries = appendSample(
            metricsSeries,
            frame.sample,
            METRIC_RANGE_WINDOW_MS['1h'],
            PERFORMANCE_RANGES.hour.bucketMs,
          );
        }

        // On the 1-minute window the vital cards are live every second, paused or not; on the
        // other ranges they follow the chosen interval like Performance. The sparklines keep
        // every sample (they are history); only the figure on the card is throttled — the feed
        // can be faster than the pick (a node + plugin server gets a merged sample on each
        // side's frame, and the hub sends the fastest rate any watcher asked for).
        if (vitalsRange === '1m' || vitalsInterval !== 0) {
          vitalsSeries = vitalsData;
          vitalsThrottle.setInterval(vitalsRange === '1m' ? LIVE_RANGE_INTERVAL : vitalsInterval);
          vitalsThrottle.push(metricsSample);
        }

        // Performance moves at the chosen interval, showing the newest sample of each interval.
        // Paused keeps its picture.
        if (vitalsInterval !== 0) {
          perfThrottle.setInterval(vitalsInterval);
          perfThrottle.push(metricsSample);
        }
      }),
    );
    releases.push(subscribeServerMetrics(id, requestedMetricsInterval(vitalsInterval)));

    await hydrateMetrics(id);
  }

  function unwire() {
    releases.forEach((release) => {
      try {
        release();
      } catch {
        /* releasing twice must never break teardown */
      }
    });

    releases = [];
    // A held sample must not land on the next server's cards (or on a page already gone).
    vitalsThrottle.cancel();
    perfThrottle.cancel();
  }

  /**
   * @param {number} id
   */
  async function hydrateMetrics(id) {
    await Promise.all([loadVitals(id), loadPerformance(id)]);
  }

  /**
   * The vital sparklines' window: `1m` keeps only the live samples of the last minute, every
   * other range fetches the stored series again (and the live feed then keeps appending to it).
   *
   * @param {number} id
   */
  async function loadVitals(id) {
    const generation = ++vitalsGeneration;
    const range = vitalsRange;

    if (range === '1m') {
      const cutoff = Date.now() - METRIC_RANGE_WINDOW_MS['1m'];

      vitalsData = vitalsData.filter((row) => row.ts >= cutoff);
      vitalsThrottle.cancel();
      vitalsSample = metricsSample;
      vitalsSeries = vitalsData;
      vitalsLoading = false;

      return;
    }

    const body = await ApiUtil.get({
      path: `/api/panel/servers/${id}/metrics?range=${range}`,
      handler: (response) => response,
    });

    if (destroyed || wiredId !== id || generation !== vitalsGeneration) {
      return;
    }

    if (body && !body.error) {
      vitalsData = normalizeSeries(body.series);

      if (body.latest) {
        metricsSample = body.latest;
      }
    }

    // An explicit fetch always reaches the cards — that is what "Refresh now" is for, Paused or
    // not.
    vitalsThrottle.cancel();
    vitalsSample = metricsSample;
    vitalsSeries = vitalsData;
    vitalsLoading = false;
  }

  /**
   * @param {number} id
   */
  async function loadPerformance(id) {
    const generation = ++performanceGeneration;

    const body = await ApiUtil.get({
      path: `/api/panel/servers/${id}/metrics?${PERFORMANCE_RANGES[performanceRange].query}`,
      handler: (response) => response,
    });

    if (destroyed || wiredId !== id || generation !== performanceGeneration) {
      return;
    }

    if (body && !body.error) {
      metricsSeries = normalizeSeries(body.series);

      if (body.latest) {
        metricsSample = body.latest;
      }
    }

    // An explicit fetch reaches the card even while Paused.
    perfThrottle.cancel();
    perfSample = metricsSample;
    perfSeries = metricsSeries;
    metricsLoading = false;
  }

  /**
   * @template T
   * @param {string} key
   * @param {readonly T[]} allowed
   * @param {T} fallback
   * @returns {T}
   */
  function loadStoredChoice(key, allowed, fallback) {
    try {
      const stored = localStorage.getItem(key);

      return allowed.includes(/** @type {T} */ (stored)) ? /** @type {T} */ (stored) : fallback;
    } catch {
      return fallback;
    }
  }

  /** @returns {boolean} */
  function loadServerTimeChoice() {
    try {
      return localStorage.getItem(SERVER_TIME_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  function storeChoice(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage is a convenience; the choice still holds for this visit.
    }
  }

  function onVitalsRangeChange() {
    storeChoice(VITALS_RANGE_KEY, vitalsRange);

    // The 1-minute window needs a sample a second whatever the interval says.
    applyVitalsInterval();

    if (viewId != null) {
      void loadVitals(viewId);
    }
  }

  function onServerTimeChange() {
    storeChoice(SERVER_TIME_KEY, useServerTime ? 'true' : 'false');
  }

  /**
   * @param {'hour' | 'day' | 'week'} key
   */
  function setPerformanceRange(key) {
    if (performanceRange === key) {
      return;
    }

    performanceRange = key;

    if (viewId != null) {
      void loadPerformance(viewId);
    }
  }

  /**
   * @param {number} interval a [METRIC_REFRESH_INTERVALS] entry.
   * @returns {number} the `metricsIntervalMs` to ask the hub for.
   */
  function requestedMetricsInterval(interval) {
    const chosen = metricRequestInterval(interval);

    // The 1-minute vitals window runs at a sample a second on its own; the feed has to be at
    // least that fast, and the Performance card thins it back down to the chosen interval.
    return vitalsRange === '1m' ? Math.min(chosen, LIVE_RANGE_INTERVAL) : chosen;
  }

  function onVitalsIntervalChange() {
    storeMetricRefreshInterval(VITALS_INTERVAL_KEY, vitalsInterval);

    applyVitalsInterval();
  }

  /** Sends the current interval to the hub and, when leaving Paused, catches the cards up. */
  function applyVitalsInterval() {
    if (viewId != null) {
      setServerMetricsInterval(viewId, requestedMetricsInterval(vitalsInterval));
    }

    // Leaving Paused catches the cards up with everything the feed kept collecting.
    if (vitalsInterval !== 0) {
      vitalsThrottle.cancel();
      perfThrottle.cancel();
      vitalsSample = metricsSample;
      vitalsSeries = vitalsData;
      perfSample = metricsSample;
      perfSeries = metricsSeries;
    }
  }

  /** "Refresh now": the stored hour and the latest sample, fetched again. */
  async function refreshVitals() {
    if (viewId == null || vitalsRefreshing) {
      return;
    }

    vitalsRefreshing = true;

    try {
      await hydrateMetrics(viewId);
    } finally {
      vitalsRefreshing = false;
    }
  }

  /**
   * @param {Array<object>} series
   */
  function normalizeSeries(series) {
    return (Array.isArray(series) ? series : [])
      .map((row) => ({
        ts: Number(row.ts ?? row.t) || 0,
        tps: row.tps == null ? null : Number(row.tps),
        players: row.players == null ? null : Number(row.players),
        cpu: numberOrNull(row.cpu),
        mem: numberOrNull(row.memUsed),
        disk: numberOrNull(row.diskUsed),
        netRx: numberOrNull(row.netRx),
        netTx: numberOrNull(row.netTx),
        memRss: positiveOrNull(row.memRss),
        // Who measured the minute: a node row's memory is the process's resident set, a
        // plugin row's is the JVM heap, and the two must not share one RAM line.
        memSource: row.source === 'node' ? 'node' : 'plugin',
      }))
      .filter((row) => row.ts > 0);
  }

  /**
   * Live samples are appended to the chart so it keeps moving between page loads; the backend
   * persists one row a minute, so this only bridges the gap until the next reload.
   *
   * @param {Array<{ ts: number, tps: number|null, players: number|null }>} series
   * @param {object} sample
   * @param {number} windowMs how far back the series reaches; older rows fall off.
   * @param {number} [bucketMs] one point per this many ms (the range's bucket); 0 keeps every
   *   sample, which is what the live one-minute window draws.
   */
  function appendSample(series, sample, windowMs, bucketMs = 0) {
    const ts = Number(sample.t) || Date.now();
    const point = {
      ts,
      tps: Array.isArray(sample.tps) && sample.tps.length ? Number(sample.tps[0]) : null,
      players: sample.playerCount == null ? null : Number(sample.playerCount),
      cpu: numberOrNull(sample.cpu) ?? numberOrNull(sample.processCpu),
      mem: positiveOrNull(sample.memUsed) ?? positiveOrNull(sample.memRss),
      disk: numberOrNull(sample.diskUsed),
      netRx: numberOrNull(sample.netRx),
      netTx: numberOrNull(sample.netTx),
      memRss: positiveOrNull(sample.memRss),
      memSource:
        positiveOrNull(sample.memUsed) != null && sample.source !== 'node' ? 'plugin' : 'node',
    };

    // Only a sample for the very same moment is replaced; anything outside the window drops.
    const next = series.filter((row) => row.ts < ts && ts - row.ts <= windowMs);

    // On every range but the live minute the chart is one point per bucket (a minute on the
    // hour), like the stored rows it continues: a sample in the bucket of the last point joins
    // that point instead of adding one, however fast the samples come.
    const bucket = Number(bucketMs) > 0 ? Number(bucketMs) : 0;
    const last = next[next.length - 1];

    if (bucket && last && Math.floor(last.ts / bucket) === Math.floor(ts / bucket)) {
      next[next.length - 1] = mergeBucketPoint(last, point);
    } else {
      next.push(point);
    }

    return next.length > VITALS_MAX_POINTS ? next.slice(next.length - VITALS_MAX_POINTS) : next;
  }

  /**
   * One bucket's point with another sample of the same bucket folded in: CPU and traffic keep
   * the bucket's peak, the way the stored minute does (MetricPeaks), everything else and the
   * time are the newer sample's.
   *
   * @param {object} current
   * @param {object} point
   */
  function mergeBucketPoint(current, point) {
    /** @param {number | null} a @param {number | null} b */
    const peak = (a, b) => (a == null ? b : b == null ? a : Math.max(a, b));

    return {
      ...current,
      ...Object.fromEntries(Object.entries(point).filter(([, value]) => value != null)),
      ts: point.ts,
      cpu: peak(current.cpu, point.cpu),
      netRx: peak(current.netRx, point.netRx),
      netTx: peak(current.netTx, point.netTx),
    };
  }

  /**
   * @param {object | null} sample
   */
  function describeTps(sample) {
    const averages = Array.isArray(sample?.tps) ? sample.tps : [];
    const parts = [0, 1, 2].map((index) => numberOrNull(averages[index]));

    if (parts.every((part) => part == null)) {
      return {
        text: $_('pages.servers.overview.metric-unavailable'),
        class: 'text-body-secondary',
      };
    }

    // §2.4.25 — 1m/5m/15m as `20.0/15.0/7.0`; an average the server did not send reads "—".
    const text = parts
      .map((part) => (part == null ? '—' : Math.min(20, part).toFixed(1)))
      .join('/');
    const value = parts[0];

    if (value == null) {
      return { text, class: 'text-body-secondary' };
    }

    if (value >= 19.5) {
      return { text, class: 'text-success' };
    }

    return { text, class: value >= 18 ? 'text-warning-emphasis' : 'text-danger' };
  }

  /**
   * @param {object} server the server on screen.
   * @param {object} pageData
   * @param {(key: string, options?: object) => string} t
   * @returns {Array<{ key: string, title: string, rows: Array<{ key: string, label: string, kind?: string, text?: string, time?: number, mono?: boolean }> }>}
   */
  function buildStatGroups(server, pageData, t) {
    if (!server) {
      return [];
    }

    const info = 'pages.servers.overview.info.';
    const managed = isManaged(server);

    /** @type {Array<{ key: string, label: string, kind?: string, text?: string, time?: number, mono?: boolean }>} */
    const general = [
      { key: 'motd', label: `${info}motd`, text: plainMotd(server.motd) || '—' },
      { key: 'id', label: `${info}id`, text: String(server.id), mono: true },
      ...(server.uuid
        ? [{ key: 'uuid', label: `${info}uuid`, kind: 'uuid', text: server.uuid }]
        : []),
      {
        key: 'added',
        label: 'pages.servers.overview.date-added',
        kind: 'date',
        time: server.acceptedTime,
      },
      { key: 'zone', label: `${info}time-zone`, text: server.timeZone || '—' },
      // A software with nowhere to put a plugin (Vanilla) has no count to show, ever (§6).
      ...(isFeatureNotSupported(server, 'plugins.list')
        ? []
        : [
            {
              key: 'plugins',
              label: `${info}installed-plugins`,
              text: String(pageData?.pluginCount ?? '—'),
            },
          ]),
      // Only a server with somewhere to keep one: the row would otherwise read "—" forever.
      ...(managed && hasPermission(Permissions.MANAGE_SERVER_BACKUPS)
        ? [{ key: 'backup', label: 'pages.servers.overview.last-backup', kind: 'last-backup' }]
        : []),
    ];

    const network = [
      { key: 'address', label: `${info}local-address`, text: getLocalAddress(server), mono: true },
      ...(managed
        ? [
            {
              key: 'port',
              label: `${info}game-port`,
              text: String(server.gamePort ?? '—'),
              mono: true,
            },
          ]
        : []),
    ];

    const groups = [
      { key: 'general', title: `${info}section-general`, rows: general },
      { key: 'network', title: `${info}section-network`, rows: network },
    ];

    if (managed) {
      groups.push({
        key: 'runtime',
        title: `${info}section-runtime`,
        rows: [
          { key: 'adopted', label: `${info}adopted`, text: yesNo(server.adopted, t) },
          {
            key: 'stdin',
            label: `${info}console-input`,
            text:
              server.stdinAvailable === false
                ? t(`${info}console-input-unavailable`)
                : t(`${info}console-input-available`),
          },
          {
            key: 'java',
            label: `${info}java`,
            text: server.javaVersion ? `Java ${server.javaVersion}` : t(`${info}java-automatic`),
          },
          Array.isArray(server.jvmArgs) && server.jvmArgs.length
            ? {
                key: 'jvm',
                label: `${info}jvm-args`,
                kind: 'code',
                // A dozen tuning flags drown out the rest of the card, so they open on request.
                collapsible: true,
                count: server.jvmArgs.length,
                text: server.jvmArgs.join(' '),
              }
            : { key: 'jvm', label: `${info}jvm-args`, text: t(`${info}jvm-args-none`) },
          { key: 'autostart', label: `${info}auto-start`, text: yesNo(server.autoStart, t) },
          { key: 'crash', label: `${info}crash-restart`, text: yesNo(server.crashRestart, t) },
          {
            key: 'exit',
            label: `${info}last-exit-code`,
            text: String(server.lastExitCode ?? '—'),
            mono: true,
          },
          // A server run where it already lived: the folder is the admin's, not the node's.
          ...(isInPlace(server) && server.directory
            ? [{ key: 'directory', label: `${info}directory`, text: server.directory, mono: true }]
            : []),
        ],
      });
    }

    // The Pano Agent is never listed as a node, so what it is and where it runs shows here.
    if (isAgentServer(server) && server.agentInfo) {
      const agentInfo = server.agentInfo;
      const platform = [agentInfo.os, agentInfo.arch].filter(Boolean).join(' / ');

      groups.push({
        key: 'agent',
        title: `${info}section-agent`,
        rows: [
          {
            key: 'agent-status',
            label: `${info}agent-status`,
            text: t(agentInfo.online ? 'pages.servers.card.online' : 'pages.servers.card.offline'),
          },
          {
            key: 'agent-version',
            label: `${info}agent-version`,
            text: agentInfo.updateAvailable
              ? t(`${info}agent-version-update`, { values: { version: agentInfo.version || '—' } })
              : agentInfo.version || '—',
            mono: true,
          },
          ...(agentInfo.host
            ? [{ key: 'agent-host', label: `${info}agent-host`, text: agentInfo.host, mono: true }]
            : []),
          ...(platform
            ? [{ key: 'agent-platform', label: `${info}agent-platform`, text: platform }]
            : []),
        ],
      });
    }

    if (server.pluginVersion != null) {
      groups.push({
        key: 'plugin',
        title: `${info}section-plugin`,
        rows: [
          {
            key: 'version',
            label: `${info}plugin-version`,
            kind: 'plugin-version',
            text: pageData?.panoPlugin?.version || server.pluginVersion || '—',
          },
          {
            key: 'protocol',
            label: `${info}protocol`,
            text: String(server.protocolVersion ?? '—'),
          },
          { key: 'caps', label: `${info}capabilities`, kind: 'capabilities' },
          {
            key: 'connected',
            label: `${info}last-connected`,
            kind: 'date',
            time: server.startTime,
          },
          {
            key: 'disconnected',
            label: `${info}last-disconnected`,
            kind: 'date',
            time: server.stopTime,
          },
        ],
      });
    }

    return groups;
  }

  /**
   * The MOTD without its `§` formatting codes; it is rendered as text either way.
   *
   * @param {unknown} motd
   */
  function plainMotd(motd) {
    return String(motd ?? '')
      .replace(/§[0-9a-fk-orx]/gi, '')
      .trim();
  }

  /**
   * @param {unknown} value
   * @param {(key: string) => string} t
   */
  function yesNo(value, t) {
    if (value == null) {
      return '—';
    }

    return value ? t('pages.servers.overview.info.yes') : t('pages.servers.overview.info.no');
  }

  /**
   * @param {string} uuid
   */
  function copyUuid(uuid) {
    copy(uuid);
    uuidCopied = true;
    clearTimeout(uuidCopiedTimer);
    uuidCopiedTimer = setTimeout(() => (uuidCopied = false), 2000);
  }

  /**
   * @param {object | null} sample
   */
  function describeMspt(sample) {
    const value = sample?.mspt == null ? null : Number(sample.mspt);

    if (value == null || !Number.isFinite(value)) {
      return {
        text: $_('pages.servers.overview.metric-unavailable'),
        class: 'text-body-secondary',
      };
    }

    const text = $_('pages.servers.overview.mspt-value', { values: { value: value.toFixed(1) } });

    if (value <= 40) {
      return { text, class: 'text-success' };
    }

    return { text, class: value <= 50 ? 'text-warning-emphasis' : 'text-danger' };
  }

  /**
   * @param {number} bytes
   */
  function formatBytes(bytes) {
    const gigabytes = bytes / 1024 ** 3;

    if (gigabytes >= 1) {
      return `${gigabytes.toFixed(1)} GB`;
    }

    return `${Math.round(bytes / 1024 ** 2)} MB`;
  }

  /**
   * @param {unknown} value
   * @returns {number | null}
   */
  function numberOrNull(value) {
    const number = value == null ? Number.NaN : Number(value);

    return Number.isFinite(number) ? number : null;
  }

  /**
   * A figure that is only meaningful above zero — a total or a limit of 0 is "not measured".
   *
   * @param {unknown} value
   * @returns {number | null}
   */
  function positiveOrNull(value) {
    const number = numberOrNull(value);

    return number != null && number > 0 ? number : null;
  }

  /** @param {number} value */
  function formatPercent(value) {
    return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
  }

  /**
   * Memory as a share of what the server may use, uncapped: a process above its setting (one
   * still running with the heap of an older rule, or a JVM with large native buffers) reads
   * 140 %, which is what "2.1 GB / 1.5 GB" beside it says. CPU stays capped, where a figure above
   * 100 only means several cores.
   *
   * @param {number} value
   */
  function formatMemoryPercent(value) {
    return `${Math.round(Math.max(0, value))}%`;
  }

  /**
   * Bytes per second; below one byte `formatBytes` has no unit to pick, so it reads as 0 B/s.
   * The number and its unit are held together, so a narrow card only ever breaks between the
   * ↓ and ↑ halves.
   *
   * @param {number} value
   */
  function formatRate(value) {
    const bytes = Math.round(Number(value) || 0);

    return `${bytes >= 1 ? formatByteSize(bytes, 1) : '0 B'}/s`.replace(' ', '\u00a0');
  }

  /**
   * The big value and secondary line of each vital card (§2.4.22 B). Every figure that is not
   * known reads as "—".
   *
   * @param {(key: string, options?: object) => string} t passed in so a language change
   *   re-renders the cards.
   * @param {object | null} sample the latest 10-second metrics sample; null once the server is
   *   down, so a stopped server does not keep showing the CPU and traffic of its last sample.
   * @param {object | null} current the server row, for what outlives a sample (disk).
   */
  function describeVitals(t, sample, current) {
    const unknown = { value: '', secondary: '' };

    // RAM — the server process against its memory setting wherever a node measures the process
    // (every managed server, with or without the plugin): the setting is the whole process, the
    // heap only gets part of it (the node's JvmHeap). A server only its plugin measures (a linked
    // one) shows the heap against `-Xmx`, which is all it reports; a node sample of a server with
    // no setting shows its share of the host.
    let ram = unknown;

    const processUsed = processMemoryOf(sample);
    const setting = memorySettingOf(current);

    if (processUsed != null && setting != null) {
      ram = {
        value: formatMemoryPercent((processUsed / setting) * 100),
        secondary: `${formatByteSize(processUsed, 1)} / ${formatByteSize(setting, 1)}`,
        // The sparkline's top, so the line sits where the percentage says it does.
        max: setting,
      };
    } else if (sample?.source === 'node') {
      const total = positiveOrNull(sample.hostMemTotal);

      if (processUsed != null) {
        ram = total
          ? {
              value: formatMemoryPercent((processUsed / total) * 100),
              secondary: `${formatByteSize(processUsed, 1)} / ${formatByteSize(total, 1)}`,
              max: total,
            }
          : { value: formatByteSize(processUsed, 1), secondary: '' };
      }
    } else if (sample) {
      const used = positiveOrNull(sample.memUsed);
      const max = positiveOrNull(sample.memMax);

      if (used != null) {
        ram = max
          ? {
              value: formatMemoryPercent((used / max) * 100),
              secondary: `${formatByteSize(used, 1)} / ${formatByteSize(max, 1)}`,
              max,
            }
          : { value: formatByteSize(used, 1), secondary: '' };
      }
    }

    const cpuValue = numberOrNull(sample?.cpu) ?? numberOrNull(sample?.processCpu);
    const cpu = cpuValue == null ? unknown : { value: formatPercent(cpuValue), secondary: '' };

    // Disk survives on the server row, so a stopped server still shows what it takes.
    const diskUsed = numberOrNull(sample?.diskUsed) ?? numberOrNull(current?.diskUsed);
    const diskTotal = positiveOrNull(sample?.diskTotal) ?? positiveOrNull(current?.diskTotal);
    const disk =
      diskUsed == null
        ? unknown
        : {
            value: formatByteSize(Math.max(0, diskUsed), 1),
            secondary: diskTotal ? `/ ${formatByteSize(diskTotal, 1)}` : '',
          };

    const rx = numberOrNull(sample?.netRx);
    const tx = numberOrNull(sample?.netTx);
    const network =
      rx == null && tx == null
        ? unknown
        : {
            value: `↓\u00a0${rx == null ? '—' : formatRate(rx)}\u2003↑\u00a0${tx == null ? '—' : formatRate(tx)}`,
            // A server on a node without its own counter shows the node's traffic; say so, so
            // it is never read as this server's own.
            secondary:
              sample?.netScope === 'node' ? t('pages.servers.overview.network-node-total') : '',
          };

    return { ram, cpu, disk, network };
  }

  /**
   * The sparklines, from the stored series plus the live samples appended to it.
   *
   * @param {(key: string) => string} _t the translator, so the ↓/↑ labels re-render with it.
   * @param {Array<Record<string, number | null>>} series
   * @param {object | null} sample the live sample, which decides whose memory the RAM line shows.
   */
  /** @type {number} the clock the uptime tile counts against, ticked every second. */
  let uptimeNow = Date.now();

  onMount(() => {
    const timer = setInterval(() => (uptimeNow = Date.now()), 1000);
    // A new activity entry for this server — pushed by the hub, or caused by this tab (the
    // fallback for an older backend) — refreshes the card, a burst coalesced into one fetch.
    const offActivity = onServerActivity((frame) => {
      if (activityWiredId == null || Number(frame.serverId) !== Number(activityWiredId)) {
        return;
      }

      clearTimeout(activityRefreshTimer);
      activityRefreshTimer = setTimeout(() => void refreshActivity(activityWiredId), 300);
    });

    return () => {
      clearInterval(timer);
      offActivity();
      clearTimeout(activityRefreshTimer);
      clearTimeout(freshActivityTimer);
    };
  });

  /**
   * Fetches the newest entries again without the loading state: the old list stays until the new
   * one arrives, and the entries it did not have before are highlighted for a moment.
   *
   * @param {number} id
   */
  async function refreshActivity(id) {
    if (activityLoading || activityStatus !== 'ok' || !hasPermission(Permissions.MANAGE_SERVERS)) {
      return;
    }

    const result = await fetchServerActivity({ serverId: id, limit: RECENT_ACTIVITY_ENTRIES });

    if (destroyed || activityWiredId !== id || result.status !== 'ok') {
      return;
    }

    const known = new Set(recentActivity.map((entry) => entry.id));
    const next = result.entries.slice(0, RECENT_ACTIVITY_ENTRIES);

    recentActivity = next;
    freshActivityIds = new Set(
      next.filter((entry) => !known.has(entry.id)).map((entry) => entry.id),
    );

    clearTimeout(freshActivityTimer);
    freshActivityTimer = setTimeout(() => (freshActivityIds = new Set()), 1500);
  }

  /**
   * @param {object | null} sample
   * @param {object | null} server
   */
  function describePlayers(sample, server) {
    const count = sample?.playerCount ?? server?.playerCount;
    const max = sample?.maxPlayerCount ?? server?.maxPlayerCount;

    return count == null
      ? $_('pages.servers.overview.metric-unavailable')
      : `${count}/${max ?? '?'}`;
  }

  /**
   * "2d 4h", "3h 12m", "5m 09s" — the two largest units, which is all a glance needs.
   *
   * @param {number} startedAt epoch ms, 0 when unknown
   * @param {boolean} online
   * @param {number} now
   */
  function describeUptime(startedAt, online, now) {
    if (!online || !startedAt || startedAt > now) {
      return $_('pages.servers.overview.metric-unavailable');
    }

    const total = Math.floor((now - startedAt) / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (value) => String(value).padStart(2, '0');

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${pad(minutes)}m`;
    }

    return `${minutes}m ${pad(seconds)}s`;
  }

  /**
   * The whole server process' memory in a sample, when a node measured it: `memRss`, which a node
   * adds to the plugin's sample too, or a node-only sample's own `memUsed`.
   *
   * @param {object | null} sample
   * @returns {number | null}
   */
  function processMemoryOf(sample) {
    if (!sample) {
      return null;
    }

    return (
      positiveOrNull(sample.memRss) ??
      (sample.source === 'node' ? positiveOrNull(sample.memUsed) : null)
    );
  }

  /**
   * @param {object | null} current the server row.
   * @returns {number | null} its memory setting in bytes.
   */
  function memorySettingOf(current) {
    const megabytes = positiveOrNull(current?.memoryMb);

    return megabytes == null ? null : megabytes * 1024 * 1024;
  }

  function buildVitalSeries(_t, series, sample) {
    const rows = Array.isArray(series) ? series : [];
    const of = (/** @type {string} */ key) => rows.map((row) => ({ ts: row.ts, value: row[key] }));
    // The RAM line follows the figure the card shows: the whole process while a node measures it
    // (its `memRss`, or a node row's own figure), the heap only for a server nothing else measures.
    // A minute from before the process was recorded at all (rows older than that column) falls
    // back to its heap rather than reading as an empty server: lower than the process, never zero.
    const processLine = processMemoryOf(sample) != null;

    return {
      ram: rows.map((row) => ({
        ts: row.ts,
        value: processLine ? (row.memRss ?? row.mem) : row.memSource === 'plugin' ? row.mem : null,
      })),
      cpu: of('cpu'),
      disk: of('disk'),
      network: [
        { label: '↓', points: of('netRx') },
        { label: '↑', points: of('netTx'), color: 'rgba(255, 255, 255, 0.6)', dashed: true },
      ],
    };
  }

  /**
   * @param {import('$lib/serverConsole.util.js').ConsoleEntry[]} entries
   */
  function capConsole(entries) {
    return entries.length > MINI_CONSOLE_MAX_LINES
      ? entries.slice(entries.length - MINI_CONSOLE_MAX_LINES)
      : entries;
  }

  /**
   * @param {object | undefined} pageData
   * @param {number | null} id
   */
  function hydrateConsole(pageData, id) {
    const result = pageData?.consoleHistory;

    // A `load` re-run skips the history it already has; that is not a new replay.
    if (id == null || consoleHydratedId === id || !result) {
      return;
    }

    consoleHydratedId = id;
    consoleHistoryLoadedFor = String(id);
    // Whatever went wrong — the page never toasts for the mini console; the console page is
    // where an admin goes to find out.
    consoleEntries =
      result.status === 'ok'
        ? capConsole(appendConsoleLines([], result.lines, result.dropped))
        : [];
  }

  /**
   * @param {number} id
   */
  function wireConsole(id) {
    unwireConsole();

    const offConsole = onServerConsole((frame) => {
      if (Number(frame.serverId) !== Number(id)) {
        return;
      }

      consoleEntries = capConsole(appendConsoleLines(consoleEntries, frame.lines, frame.dropped));
    });
    const release = subscribeServerConsole(id);

    releaseConsoleFeed = () => {
      offConsole();
      release();
    };
  }

  function unwireConsole() {
    releaseConsoleFeed?.();
    releaseConsoleFeed = null;
  }

  onDestroy(() => {
    destroyed = true;
    unwire();
    unwireConsole();
    // The next visit mounts a fresh page that has to be given its history again.
    consoleHistoryLoadedFor = null;
  });
</script>
