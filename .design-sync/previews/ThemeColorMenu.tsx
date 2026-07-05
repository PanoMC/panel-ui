import * as React from 'react';
import { ThemeColorMenu } from '@panomc/panel-ui';

// The component uses Bootstrap's `d-none d-lg-flex`, so it only shows at the lg
// breakpoint (>=992px). Capture cells are narrower, so reveal the desktop layout.
const Desktop = ({ children }: { children: React.ReactNode }) => (
  <div className="tcm-preview" style={{ display: 'inline-block' }}>
    <style>{'.tcm-preview .d-none.d-lg-flex { display: flex !important; }'}</style>
    {children}
  </div>
);

export const DarkActive = () => (
  <Desktop>
    <ThemeColorMenu currentTheme="dark" onThemeSelect={() => {}} />
  </Desktop>
);

export const LightActive = () => (
  <Desktop>
    <ThemeColorMenu currentTheme="light" onThemeSelect={() => {}} />
  </Desktop>
);

export const CopperActive = () => (
  <Desktop>
    <ThemeColorMenu currentTheme="copper" onThemeSelect={() => {}} />
  </Desktop>
);
