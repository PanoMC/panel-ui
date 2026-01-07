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
  const filePath = path.resolve(`plugins/${safePluginId}/client/${safeFileName}`);

  // Ensure that the file exists and belongs to the intended plugin
  if (!filePath.startsWith(path.resolve(`plugins/${safePluginId}/client/`))) {
    return new Response('Access to this file is forbidden.', { status: 403 });
  }

  try {
    const data = fs.readFileSync(filePath);

    // Use mime-types to automatically determine the content type
    const contentType = mime.lookup(fileName) || 'application/octet-stream'; // Default to 'application/octet-stream' if mime type is unknown

    return new Response(data, {
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    console.log(error);
    return new Response('File not found or unable to read.', { status: 404 });
  }
}
