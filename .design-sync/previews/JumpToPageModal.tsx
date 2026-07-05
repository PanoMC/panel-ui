import * as React from 'react';
import { JumpToPageModal } from '@panomc/panel-ui';

// Opened imperatively by Pagination.svelte: showJumpModal(currentPage, maxPage, cb).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (JumpToPageModal as any).show(3, 12, () => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (JumpToPageModal as any).hide();
      } catch {}
    };
  }, []);
  return <JumpToPageModal previewOpen />;
};

export const JumpToPage = () => <Opened />;
