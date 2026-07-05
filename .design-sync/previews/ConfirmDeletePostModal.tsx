import * as React from 'react';
import { ConfirmDeletePostModal } from '@panomc/panel-ui';

// Opened from the posts list: ConfirmDeletePostModal.show(post).
// status 0 (already trashed) → delete permanently; any other status → move to trash.
const Opened = ({ post }: { post: any }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDeletePostModal as any).show(post);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmDeletePostModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmDeletePostModal previewOpen />;
};

export const MoveToTrash = () => (
  <Opened post={{ id: 12, title: 'CraftRealms updated to 1.21.4', status: 1 }} />
);

export const DeletePermanently = () => (
  <Opened post={{ id: 9, title: 'Old 2024 Halloween event recap', status: 0 }} />
);
