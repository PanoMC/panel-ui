import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ params }) {
  const { pluginId, fileName } = params;

  // Ensure pluginId and fileName are safe and sanitize inputs
  if (!pluginId || !fileName || typeof pluginId !== 'string' || typeof fileName !== 'string') {
    return new Response('Invalid parameters.', { status: 400 });
  }

  // Sanitize pluginId and fileName to prevent directory traversal
  const safePluginId = path.basename(pluginId); // Prevent directory traversal by using only the base name
  const safeFileName = path.basename(fileName); // Same for fileName

  // Construct the absolute file path
  const baseDir = path.resolve(`plugins/${safePluginId}/client`) + path.sep;
  const filePath = path.resolve(baseDir, safeFileName);

  // Ensure that the resolved path stays inside the plugin's client directory
  if (!filePath.startsWith(baseDir)) {
    return new Response('Access to this file is forbidden.', { status: 403 });
  }

  try {
    const data = fs.readFileSync(filePath);

    // Use mime-types to automatically determine the content type
    const contentType = mime.lookup(fileName) || 'application/octet-stream'; // Default to 'application/octet-stream' if mime type is unknown

    /** @type {Record<string, string>} */
    const headers = { 'Content-Type': contentType };

    if (safeFileName === 'client.mjs') {
      // Stable-named entry: must be revalidated on every load.
      headers['Cache-Control'] = 'no-cache';
      const stats = fs.statSync(filePath);
      headers['ETag'] = `"${stats.size}-${stats.mtimeMs}"`;
    } else if (/-[\da-f]+\.[a-z0-9]+$/i.test(safeFileName)) {
      // Content-hashed chunk (e.g. foo-1a2b3c4d.js): safe to cache forever.
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    return new Response(data, { headers });
  } catch (_) {
    return new Response('File not found or unable to read.', { status: 404 });
  }
}
