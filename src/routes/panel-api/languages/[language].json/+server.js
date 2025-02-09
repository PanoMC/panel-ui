import fs from "fs";
import path from "path";

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET({ params }) {
  const { language } = params;
  let filePath = path.resolve(`lang/${language}.json`);

  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(path.dirname(process.argv[1]) + `/lang/${language}.json`);
  }

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return new Response(fileContent, {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } else {
    return new Response(JSON.stringify({ error: "Language file not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
