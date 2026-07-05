import * as React from 'react';
import { CategoryBadge } from '@panomc/panel-ui';

export const PostCategory = () => (
  <CategoryBadge
    category={{ title: 'Announcements', url: 'announcements' }}
    pageType="posts"
    filterTitle="Filter posts by this category"
    noCategoryText="No category"
  />
);

export const TicketCategory = () => (
  <CategoryBadge
    category={{ title: 'Ban Appeals', url: 'ban-appeals' }}
    pageType="tickets"
    filterTitle="Filter tickets by this category"
    noCategoryText="No category"
  />
);

export const NoCategory = () => (
  <CategoryBadge
    category={{ title: '-', url: '-' }}
    pageType="posts"
    filterTitle="Filter posts by this category"
    noCategoryText="No category"
  />
);
