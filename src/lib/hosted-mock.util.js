/**
 * Dev-only Pano Host preview: with `VITE_MOCK_HOSTED=true` in `.env` the panel looks like it runs on
 * Pano Host (banner, notices, host mail choice) without restarting the backend with `PANO_HOSTED`.
 * Only under `vite dev`: a production build never enables it, whatever its env says.
 */
import { PANO_WEBSITE_URL } from '$lib/variables.js';

export const hostedMocked = import.meta.env.DEV && import.meta.env.VITE_MOCK_HOSTED === 'true';

const DAY_MS = 24 * 60 * 60 * 1000;
const GIB = 1024 * 1024 * 1024;
const WORKLOAD_ID = 'p-k3x9q2m7ta';

/** Pano Pay's dunning grace: 3 days after the first failed renewal (`RenewalEngine.graceMs`). */
const PAYMENT_GRACE_MS = 3 * DAY_MS;

/**
 * One notice as `GET /api/v1/panel/hosted` relays it: the control plane's `HostInstanceNotices.build`
 * shape after the platform's `PanoHostClient.notices` (null `data` values dropped, no `url`).
 */
function notice(id, level, type, title, message, data = {}) {
  return { id, level, title, message, url: null, createdAt: null, type, data };
}

/**
 * What `GET /api/v1/panel/hosted` answers on Pano Host: a Starter-package workload (10 GB disk,
 * 100 GB/month traffic) with every notice the control plane can send at once. `manageUrl` comes from
 * the control plane's `websiteUrl` (panomc.com, dev.panomc.com, local.panomc.com:3003, …); here the
 * panel's own website stands in for it. `HOST_DELETION_SCHEDULED`
 * is left out: a deleted workload is stopped right away, so its panel never shows it.
 */
export function mockHostedInfo() {
  const now = Date.now();
  const trialEndsAt = now + 2 * DAY_MS;
  const pastDueSince = now - DAY_MS;
  const graceExpiresAt = pastDueSince + PAYMENT_GRACE_MS;

  return {
    hosted: true,
    workloadId: WORKLOAD_ID,
    manageUrl: `${PANO_WEBSITE_URL.replace(/\/+$/, '')}/host/manage/instances/${WORKLOAD_ID}`,
    notices: [
      notice(
        'disk',
        'warning',
        'HOST_DISK_QUOTA',
        'Storage almost full',
        'This instance uses 93% of its 10240 MB storage.',
        { usedMb: 9523, quotaMb: 10240, percent: 93 },
      ),
      notice(
        'traffic',
        'critical',
        'HOST_TRAFFIC_QUOTA',
        'Monthly traffic almost used',
        "This instance used 100% of this month's traffic.",
        { usedBytes: 101 * GIB, quotaBytes: 100 * GIB, percent: 101 },
      ),
      notice(
        'trial',
        'warning',
        'HOST_TRIAL_ENDING',
        'Trial ending',
        'The free trial of this instance ends in 2 day(s). Choose a plan on panomc.com to keep it.',
        { endsAt: trialEndsAt, days: 2 },
      ),
      notice(
        'payment',
        'critical',
        'HOST_PAYMENT_PAST_DUE',
        'Payment failed',
        'The renewal payment of this instance failed. Update your payment method on panomc.com within 2 day(s) to keep it.',
        { pastDueSince, graceExpiresAt },
      ),
    ],
  };
}

/**
 * Platform settings `email.hostMail` as Pano Host sends it (`HostedEnvConfig.hostMail`): the Portal
 * relay on the workload network, never its password. [hostSender] = the stored custom sender.
 */
export function mockHostMail(hostSender) {
  const defaultSender = 'noreply@shop.panomc.site';

  return {
    hostname: 'pano-mail-relay',
    port: 2525,
    ssl: false,
    starttls: 'OPTIONAL',
    username: `sx_${WORKLOAD_ID.replace(/-/g, '_')}`,
    sender: String(hostSender || '').trim() || defaultSender,
    defaultSender,
  };
}
