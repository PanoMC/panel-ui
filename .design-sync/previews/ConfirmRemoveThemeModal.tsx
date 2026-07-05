import * as React from 'react';
import { ConfirmRemoveThemeModal } from '@panomc/panel-ui';

// The app opens this imperatively: show(isActive, continueProcess) — see ThemeDetail.svelte.
const Opened = ({ active }: { active: boolean }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmRemoveThemeModal as any).show(active, () => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmRemoveThemeModal as any).hide?.(); } catch {}
    };
  }, [active]);
  return <ConfirmRemoveThemeModal previewOpen />;
};

// Deleting an installed (inactive) theme, e.g. "Frost Theme" from the theme list.
export const RemoveInstalledTheme = () => <Opened active={false} />;

// Deleting the theme that is currently live on the site — stronger warning copy.
export const RemoveActiveTheme = () => <Opened active={true} />;
