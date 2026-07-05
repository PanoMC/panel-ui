import * as React from 'react';
import { ConfirmDeletePostCategoryModal } from '@panomc/panel-ui';

// Opened from Posts → Categories: ConfirmDeletePostCategoryModal.show(category).
const Opened = ({ category }: { category: any }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDeletePostCategoryModal as any).show(category);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmDeletePostCategoryModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmDeletePostCategoryModal previewOpen />;
};

export const EmptyCategory = () => (
  <Opened category={{ id: 6, title: 'Off Topic', postCount: 0, posts: [] }} />
);

export const CategoryWithPosts = () => (
  <Opened
    category={{
      id: 2,
      title: 'Server News',
      postCount: 3,
      posts: [
        { id: 11, title: 'Summer Event: Treasure Hunt starts Friday' },
        { id: 12, title: 'CraftRealms updated to 1.21.4' },
        { id: 13, title: 'Scheduled maintenance on July 10' },
      ],
    }}
  />
);

export const CategoryWithManyPosts = () => (
  <Opened
    category={{
      id: 3,
      title: 'Announcements',
      postCount: 12,
      posts: [
        { id: 21, title: 'New spawn build revealed' },
        { id: 22, title: 'Economy reset FAQ' },
        { id: 23, title: 'Staff applications open' },
        { id: 24, title: 'Anti-cheat upgrade rollout' },
        { id: 25, title: 'Nether world border extended' },
      ],
    }}
  />
);
