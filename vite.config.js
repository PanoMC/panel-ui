import { sveltekit } from "@sveltejs/kit/vite";
import fs from "fs";
import path from "path";

function copyLangFolderPlugin() {
  let outDir = "";

  return {
    name: "copy-lang-folder",
    apply: "build", // Run only during build
    configResolved(config) {
      // Get the output directory from Vite config
      outDir = "build/";
    },
    async closeBundle() {
      const srcDir = path.resolve(process.cwd(), "lang");
      const destDir = path.resolve(process.cwd(), outDir, "lang");

      if (!fs.existsSync(srcDir)) {
        console.warn(`Source folder "lang" not found at: ${srcDir}`);
        return;
      }

      try {
        // Copy the "lang" folder recursively to the destination
        await fs.promises.cp(srcDir, destDir, { recursive: true });
        console.log(`Copied "lang" folder from ${srcDir} to ${destDir}`);
      } catch (error) {
        console.error("Error copying \"lang\" folder:", error);
      }
    }
  };
}

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
    copyLangFolderPlugin()
  ],
  ssr: {
    noExternal: ["chart.js"],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8088',
      '/panel/api': 'http://localhost:8088'
    }
  }
};

export default config;
