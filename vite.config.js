import { sveltekit } from "@sveltejs/kit/vite";
import { loadEnv } from "vite";
import fs from "fs";
import path from "path";

const env = loadEnv("", process.cwd());

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

function copyManifestPlugin(filename = "manifest.json") {
  let outDir = "";

  return {
    name: "copy-manifest-json",
    apply: "build",
    configResolved(config) {
      outDir = "build/";
    },
    async closeBundle() {
      const srcPath = path.resolve(process.cwd(), filename);
      const destPath = path.resolve(process.cwd(), outDir, filename);

      if (!fs.existsSync(srcPath)) {
        console.warn(`Manifest file not found at: ${srcPath}`);
        return;
      }

      try {
        await fs.promises.copyFile(srcPath, destPath);
        console.log(`Copied manifest from ${srcPath} to ${destPath}`);
      } catch (err) {
        console.error("Failed to copy manifest.json:", err);
      }
    }
  };
}

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
    copyLangFolderPlugin(),
    copyManifestPlugin()
  ],
  ssr: {
    noExternal: ["chart.js"],
  },
  server: {
    proxy: {
      "/api": env.VITE_API_URL.replace("/api", ""),
      '/panel/api': env.VITE_API_URL.replace("/api", "")
    },
    allowedHosts: true
  }
};

export default config;
