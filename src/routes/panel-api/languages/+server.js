import fs from "fs";
import path from "path";

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET() {
  let languagesDir = path.resolve("lang");
  let files = [];

  try {
    files = fs.readdirSync(languagesDir);
  } catch (e) {
    languagesDir = path.dirname(process.argv[1]) + "/lang";
    files = fs.readdirSync(languagesDir);
  }
  const languages = {};

  files.forEach(file => {
    const filePath = path.join(languagesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const locale = path.basename(file, ".json");
    languages[locale] = {
      locale,
      name: content.name,
      "date-fns-code": content["date-fns-code"],
      derivatives: content.derivatives || []
    };
  });

  return new Response(JSON.stringify(languages), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
