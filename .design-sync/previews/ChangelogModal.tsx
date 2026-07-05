import * as React from 'react';
import { ChangelogModal } from '@panomc/panel-ui';

const CHANGELOG = `## Pano v1.8.0

### Features

- **panel**: new IP ban manager with duration presets
- **tickets**: bulk close on the tickets list

### Bug Fixes

- **plugins**: plugin UI chunks now use proper cache headers
`;

// Opened from Settings → Updates: ChangelogModal.show(markdown).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ChangelogModal as any).show(CHANGELOG);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ChangelogModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ChangelogModal previewOpen />;
};

export const ReleaseChangelog = () => <Opened />;
