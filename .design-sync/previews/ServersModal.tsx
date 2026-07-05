import * as React from 'react';
import { ServersModal } from '@panomc/panel-ui';

const M = ServersModal as any;

// Real call site (Navbar/Sidebar): showServersModal() — show() immediately GETs
// /api/panel/servers through ApiUtil (window.fetch). Serve that endpoint from
// the preview in the backend's new shape ({ pinned, otherServers }) so the modal
// renders its full data state: pinned row, "other servers" separator, search
// input, and the crown/selected treatment on the bridge's selectedServer (id 1).
// 32x32 Minecraft-block style favicons inlined as data URIs — the component's
// /assets/img/server-icon.png fallback 404s in the design sandbox and renders
// a broken-image glyph. sanitizeImageSrc whitelists data:image/png.
const FAVICON = {
  survival:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAACGElEQVR4nMWW246bMBCG/3CwzSEQULXSPsC+TJ+ir1epb1WplxAIJrYJTi9ICSEOJtGu+l8xw3g+sD1jb378/I6vlGONCNPu5ezdQdgBbeU/m3dDiqJgAPwtswPibvcs4Kzyb4Eenu2Axt+vT92kJQDpnHWg5gDJHk6FFwYrAXGV+aqlejN6rgAqHi7mqT2uBADoSDg17VP0rNyoB5AUkQWQK/c1QM9dAHXOr4BMJvdxBelnno61xoyRYxg+ygFQ0vrR64y7TXwh+SI0xnB9M3wvxNT03n/tDdiS6+wyiR//nKpiJBWzSKJKRbKp5x0ArmHmNRiz3+SaZJdwAOg8nWWfKcLxxV1EoQE4RbUcxhGsBSi2H5/9OgagIsNf3ssOcCMBgIgdAFYEALqkAUA4fwWwdR0Aiaa69QZPz9n4VuRPlPQgb2Yfeg2gdqRj3pNP6/IHoRIAvHq+Cz8N0BIG4JSwxWDwytw/NmgsgJWK0nn/GHRG/DmAF/Q/AJlMrcPEKQTQ1tupUzaGlbgAtlKOrpJaGgAA5rUp88LkMHXS2LASF8CBUmvSmSpxWhNmXgNf3FwAssayfRc0r+RBHesA7FK5+bP7/eYAq9qOUUu7aF/RMjrGd00tUDxPzAWxBCjYKQdZM+ZIoqI2l3Qf3Xxxy9yrnQuvgDIOE/mxoksn+yiX66kZin5VobEiSOX1ZHfPhotee3cLGfQX0pirhesMPeAAAAAASUVORK5CYII=',
  creative:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAACIklEQVR4nK1Wy5KbMBBssAXIIMC+5cfzR/mHnJJDKlWpSpUBSzwsLZADZMHyGLB3+4IYRt1oJLXkfP/2FUBdxjy84GPIJD+K2gq6w2MLuyvfrMi55/PXe/ZJ4KSuqwKd2A+Nfd2OvRyCkRY4R/5q6jve+I6MF8njEXwKkoIDqLXcKuCx/AUZ7omhca4CW0A17fxVm3QjqRQaQJtl8+Dp0NgCUUAXdxVCegB2x+P9JxcAaw832Zzd57HA267HMnUjYHbV/POvLLrvYxq9TJq4zZR8nBiISU6DDMDerDBaKLqAjO9///zxFNEcjVd/UV3mhY8SQlXbI6i7/r2dmx4UtBgnM9B8gR1AGXFbgLvOZTcGU+aQ3TyZkXESxBzEbfcoO0/226kfCiwgLWxDBSDMUpVGAXlZd9MBhcOtiGQlAK+gBzcKiHhy0w4NmTog6WmL1gkxOJAlckGv6NfgAnAiQoa5p9KU80jciBcFetUBMPnN4jHdOWThFZP9XQJpdWaScC1boEMluAbAUmIcPtr74PQTwiyzn2Phujj8+Zuu/sgAL59sst9wyJ4u0gUQRtVq6gCdTjbp3C5sUdJniV0WXz+9VwfIkC6mLXD16OW8Eb3/4OL1WfCZXYCnBSKHttgBWrGymi6J0rk+LaB6+pBI03Ebhof4PSh6/8USNf+XU65GK81zexsOWBGIAtr4glwBOLA+jUoyYauAapaMrzJL8zHgH2cVqjYcfSK/AAAAAElFTkSuQmCC',
  skyblock:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAACA0lEQVR4nK2WSZKjMBBFP0jMM8s6Xp+hDljH6YroYJ5BVi+MG1sWArvrryBJ5UPKVEra59dv3EToxBYTPyr9/uVk9Mh7HRBR7dC11lZ82b4OKBd+6BrwSe2QJNku4D2FIPeveZ7+DMDxmutDBbZG0dm9Q5duWZID2rRSAIoyESyXCyH9lkU327IkB3hZqABYdH42MocDMPRtlWx3H6AWdRkSSUHnQTZf1jynxBm6dwFLR5BLKiqpUwClOwHIWH81rgBadW+QpIq6h8nRP9+/1sf+ePAcp0YhKXaFxCWKKl/h/Wp0CaAMmzPDhkxSSKcAJ2WnBim2zTUVxTFgNFS1/ywWb33CjONjgDWrdu8/ef2i+GpexPJ9WqIlUANahwJgtqSvAXBMEf8AiDMKWqsBV5FBXk7f7ocKUKSq6T/LnWzBYleFCvCqOnMQLGE/AoinGoA38/8FPKtyLAD5ZAFoDU0E2OxUAg6l+Vs7egAM5KCE3tDOiVa6ijFje3xDAOA17i7Ai8Tu7XfOyuaL5cnvOKPVVIOx/aXf7QKSQAzRuH1QFAA8jUqHmP5gjX5oi01wA1R87aM0jPOaA9DSh6Oj3m84AKZG3BMXy38AhNp6Eiy3zcKzg5uWWvrY3AECpvJ9Xcbt53TNZwBQE4lX9/4M5tvy6ryRhb7K3XLAuXil9qvxDOkv+KupWi2Tky4AAAAASUVORK5CYII=',
  minigames:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAACFklEQVR4nK2WObqcMBCEa0Bo2Lf0XdQ3cuLcR/AtnDpjE/s2DuCDgWm2eVMRtET/kloqcfv54y+2Vbaaygq1YaXSDhHtzouqfu5jm2GSelsZpJ3sAB7sH4ApO4BVdgCi4TsZRsBN4gBMbc3T4K4ijNUA4kLMg6iMY8CjrwGkRb/TdVDb8joMHM1axc3a2QNMyuzokME9/zWY8ngPUJhjlYzEPQS8qhPlVtMI0NIQwL3vnttCNT0JkC31ADCokuTnV680h4cgp6d/RgfbdJCvjwXUIZMdjJioygXApBwdGc+c4DOAN8R+//l1vncUqa5b8sIKvNIsmzOfXJuB65YAak2ssgfZ7B/h0jn2AFainASb1tzTUxZmtQcQNrEIVko4D+9vW0kuF1mYmesT6ZIgAdBlOQGQ6/ASIwoebbM2bdu3AciGTgA67oXR+gMAoU4YvaRwAEwhmpqMqNm4RJ5LfPBVrucLoH8Z+yTFmGvmeIFv2J7E2VZvAHm/aJVatWebrrlSHPpAgktFPsyeGMVrkAY4Ou05+7Iz7SwgzmnXfEPfMrs22LvuPwBgfvZdgG4/7vHmdUiqLxe/JjPAioijkCe3yjm1NQUbL3BJXQx6fhHueIKMSOC6rNYk48QSZe76p+pQoTwf7z6/HwDekNfNyyvp1fTcIfj8nVywce8ykcjwRwBXzpqMLRMOOKkuhNaOe7e1bAD/AZ+3snOXjwziAAAAAElFTkSuQmCC',
  events:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAACAElEQVR4nK1Wy6KjIAyNWLEtotj17OZDZj8/MP+/nI2iyLVQH7PQW7xUQXvnrBCTc2ISA8HfP7/gE3zkLGDgA1Zax9hrNgEtH57sGZUOn/3stsAT9zbeT/GOgOpObjde8G8JeMFubFqQJDggcOGu1K9CNuMBgZYR63XIM4fzqbLDj7nN4EpR1OOeVcsd0rPlY5fZ4Ss25yCmoV/gEernusyvACBD7rD/oiR6AKAnsrfIefmx0zJO6XMtOnmsi9g1d7yVnACAqsVyM/j98wdthEjohteMGrepvhyKZgICAC87ACzZW2y+Y5BizXwhgOLKbfGKiy6NP/EEhwbl6vTv481RsYXT3Z4FKwIo9JdkFfd06M7znywx3hQYertuom72CJxrw0a0/iLwCGzSqkqTx31a0zTZI2ADZ3DTKKpHAIhGCgABNb9rltVNdH6H9wldQYHRIzUTcRTXLeNLasakCDePI30xp2lBS9jfRW1t2oP23bQ4xcpsAhEswq2ZjzeRA4DnaHSjU+boFiApX7FBWB0ooPr84qFQbksjoOMm4K4ZuUQMw+x223vtQAAwstJrBwB94o96qNmKwATRp27nsPFHjVK+KUDD2uv/Bv7zsNsUGPTLgMs9J8kxAYRf6MpZspF26odspVrktp7hWUBfiUztO9OEhNjNg6oVLlms98g/VXWey3gRdcsAAAAASUVORK5CYII=',
};

const server = (over: any = {}) => ({
  favicon: null,
  status: 'ONLINE',
  type: 'SPIGOT',
  ...over,
});

const demoServers = {
  pinned: [
    server({
      id: 1,
      name: 'CraftRealms Survival',
      favicon: FAVICON.survival,
      host: 'play.craftrealms.example',
      port: 25565,
      remoteAddress: 'play.craftrealms.example',
      playerCount: 42,
      maxPlayerCount: 100,
    }),
    server({
      id: 2,
      name: 'CraftRealms Creative',
      favicon: FAVICON.creative,
      host: 'creative.craftrealms.example',
      port: 25566,
      remoteAddress: 'creative.craftrealms.example',
      playerCount: 11,
      maxPlayerCount: 60,
    }),
  ],
  otherServers: [
    server({
      id: 3,
      name: 'Skyblock',
      customName: 'Skyblock Seasons',
      favicon: FAVICON.skyblock,
      host: 'sky.craftrealms.example',
      port: 25567,
      remoteAddress: 'sky.craftrealms.example',
      playerCount: 27,
      maxPlayerCount: 80,
    }),
    server({
      id: 4,
      name: 'Minigames Hub',
      favicon: FAVICON.minigames,
      host: 'games.craftrealms.example',
      port: 25568,
      remoteAddress: 'games.craftrealms.example',
      type: 'VELOCITY',
      playerCount: 63,
      maxPlayerCount: 200,
    }),
    server({
      id: 5,
      name: 'Events',
      favicon: FAVICON.events,
      host: 'events.craftrealms.example',
      port: 25569,
      remoteAddress: 'events.craftrealms.example',
      status: 'OFFLINE',
      playerCount: 0,
      maxPlayerCount: 150,
    }),
  ],
};

let patched = false;
function patchFetch() {
  if (patched) return;
  patched = true;
  const orig = window.fetch.bind(window);
  window.fetch = ((input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = (init?.method || 'GET').toUpperCase();
    if (url.includes('/servers') && method === 'GET') {
      return Promise.resolve(
        new Response(JSON.stringify({ result: 'ok', ...demoServers }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
    return orig(input, init);
  }) as typeof window.fetch;
}

const Opened = () => {
  patchFetch();
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        M.show();
      } catch {}
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <ServersModal previewOpen />;
};

export const PinnedAndOtherServers = () => <Opened />;
