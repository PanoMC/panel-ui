import * as React from 'react';
import { PageLoader } from '@panomc/panel-ui';

// The bar tweens to 100% and fades within ~1s of mount (the shim's navigating
// store is null). Remounting every 450ms keeps it captured mid-progress at
// full opacity — exactly how it looks during a SvelteKit navigation.
const MidNavigation = () => {
  const [k, setK] = React.useState(0);
  React.useEffect(() => {
    const i = setInterval(() => setK((v) => v + 1), 450);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{ position: 'relative', height: 20 }}>
      <style>{`.progress-bar{position:absolute !important; top:0; left:0; right:0;}`}</style>
      <PageLoader key={k} />
    </div>
  );
};

export const NavigationInProgress = () => <MidNavigation />;
