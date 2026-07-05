import * as React from 'react';
import { TableThumbnail } from '@panomc/panel-ui';

// Self-contained thumbnail image (no external hosts): a stylized grassy-block banner
const postThumbnail =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90">
      <rect width="160" height="90" fill="#3b6ea5"/>
      <rect y="58" width="160" height="32" fill="#5d8a3c"/>
      <rect y="58" width="160" height="8" fill="#79b851"/>
      <circle cx="126" cy="22" r="12" fill="#f7d774"/>
      <rect x="22" y="38" width="20" height="20" fill="#8a5a2b"/>
      <rect x="22" y="30" width="20" height="8" fill="#79b851"/>
    </svg>`
  );

export const PostThumbnail = () => (
  <TableThumbnail
    src={postThumbnail}
    alt="Summer Build Contest winners"
    href="#"
    preview={false}
    tooltipText="View post"
  />
);

export const NoImagePlaceholder = () => <TableThumbnail alt="Server maintenance notes" />;

export const CustomIconPlaceholder = () => (
  <TableThumbnail icon="fa-newspaper" alt="Draft post without a thumbnail" />
);
