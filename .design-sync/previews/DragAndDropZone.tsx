import * as React from 'react';
import { DragAndDropZone } from '@panomc/panel-ui';

// Dashed file drop zone — used for post thumbnails (PostEditor), site
// logo/favicon (WebsiteSettings) and migration file uploads (BannedIpMigration).

export const ThumbnailUpload = () => (
  <DragAndDropZone
    icon="fas fa-image fa-3x"
    title="No thumbnail set. Drop an image here or click to browse."
    style="height: 240px;"
  />
);

export const FileSelected = () => (
  <DragAndDropZone
    icon="fas fa-file-alt fs-1"
    title="banned-ips.json"
    subtitle="18.42 KB"
    style="height: 160px;"
  />
);

export const WithSubtitle = () => (
  <DragAndDropZone
    title="Drag &amp; drop your AuthMe export here"
    subtitle="or click to browse"
    style="height: 140px;"
  />
);

export const Disabled = () => (
  <DragAndDropZone
    disabled
    icon="fas fa-lock fs-1"
    title="Uploads are disabled while migration is running"
    style="height: 140px;"
  />
);

export const CustomSlotPreview = () => (
  <DragAndDropZone style="height: 200px;" {...({ class: 'p-0' } as any)}>
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'flex-end',
        padding: 12,
        background: 'linear-gradient(135deg, #2f6d3a 0%, #79b851 45%, #8fd3f4 100%)',
      }}
    >
      <span className="badge text-bg-dark">spawn-render.png — current thumbnail</span>
    </div>
  </DragAndDropZone>
);
