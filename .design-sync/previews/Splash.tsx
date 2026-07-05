import * as React from 'react';
import { Splash } from '@panomc/panel-ui';

// Happy-path boot splash. The three logos load from /assets/img/* which the
// preview host does not serve, so the real logo.svg (static/assets/img/logo.svg)
// is inlined as a data URI and the animation is frozen on the Pano frame for a
// deterministic capture. Error states (session / permission / connection) are
// driven by the module-internal networkErrorCallbacks store in $lib/Store,
// which the bridge does not expose — only the loading state renders statically.
const panoLogo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 186.05 279.07"><defs><style>.a,.b{fill:#fff;}.a{opacity:0.7;}</style></defs><path class="a" d="M0,232.56v16.51a30,30,0,0,0,30,30H63a30,30,0,0,0,30-30V186H46.51S0,186,0,232.56Z"/><path class="b" d="M156,0H30A30,30,0,0,0,0,30V232.56C0,186,46.51,186,46.51,186H156a30,30,0,0,0,30-30V30A30,30,0,0,0,156,0Z"/></svg>`,
  );

const LoadingSplash = () => {
  React.useEffect(() => {
    const fix = () => {
      document.querySelectorAll<HTMLImageElement>('img[alt="Pano"]').forEach((img) => {
        if (img.src !== panoLogo) img.src = panoLogo;
      });
    };
    fix();
    const i = setInterval(fix, 150);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{ height: 320, overflow: 'hidden', position: 'relative' }}>
      <style>{`
        .vh-100{height:320px !important;}
        .mc-anim,.hytale-anim{display:none !important;}
        .pano-anim{animation:none !important; opacity:1 !important;}
      `}</style>
      <Splash />
    </div>
  );
};

export const LoadingPanel = () => <LoadingSplash />;
