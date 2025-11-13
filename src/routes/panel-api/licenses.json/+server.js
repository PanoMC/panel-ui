import fs from "fs";
import path from "path";

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET() {
  let filePath = path.resolve(`licenses.json`);

  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(path.dirname(process.argv[1]) + `/licenses.json`);
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

