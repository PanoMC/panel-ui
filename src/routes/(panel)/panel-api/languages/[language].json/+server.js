import fs from 'fs';
import path from 'path';

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET({ params }) {
  const { language } = params;

  // Sanitize the language param to prevent path traversal.
  const safe = path.basename(language) + '.json';

  /**
   * Resolve a language file within a given base directory, rejecting any path
   * that escapes that directory.
   * @param {string} dir
   * @returns {string | null}
   */
  function resolveWithin(dir) {
    const baseDir = path.resolve(dir);
    const filePath = path.resolve(baseDir, safe);
    if (!filePath.startsWith(baseDir + path.sep)) {
      return null;
    }
    return filePath;
  }

  let filePath = resolveWithin('lang');

  if (!filePath || !fs.existsSync(filePath)) {
    const fallback = resolveWithin(path.dirname(process.argv[1]) + '/lang');
    if (fallback) {
      filePath = fallback;
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return new Response(fileContent, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    return new Response(JSON.stringify({ error: 'Language file not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
