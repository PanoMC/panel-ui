import fs from "fs";
import path from "path";

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET() {
  // Önce build klasöründen oku
  let filePath = path.resolve(process.cwd(), "build", "licenses.json");

  // Build klasöründe yoksa ana dizinden oku (development için)
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(process.cwd(), "licenses.json");
  }

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return new Response(fileContent, {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } else {
    // Dosya yoksa boş obje döndür
    return new Response(JSON.stringify({}), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}

