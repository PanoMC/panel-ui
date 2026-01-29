import { build } from "bun";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = "./static/lib/svelte";
const tempEntryDir = "./.svelte-bundle-temp";

// Clean and setup
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
if (existsSync(tempEntryDir)) rmSync(tempEntryDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(tempEntryDir, { recursive: true });

const entries = {
    "index": "svelte",
    "animate": "svelte/animate",
    "easing": "svelte/easing",
    "motion": "svelte/motion",
    "store": "svelte/store",
    "transition": "svelte/transition",
    "internal": "svelte/internal",
    "internal-client": "svelte/internal/client",
    "internal-disclose-version": "svelte/internal/disclose-version",
    "internal-flags-legacy": "svelte/internal/flags/legacy",
    "internal-flags-async": "svelte/internal/flags/async",
    "internal-flags-tracing": "svelte/internal/flags/tracing",
    "internal-server": "svelte/internal/server",
    "legacy": "svelte/legacy",
    "events": "svelte/events",
};

console.log("Generating entry points...");
const entryFiles = [];
for (const [name, path] of Object.entries(entries)) {
    const entryPath = join(tempEntryDir, `${name}.js`);
    writeFileSync(entryPath, `export * from "${path}";\n`);
    entryFiles.push(entryPath);
}

console.log("Bundling Svelte...");
const result = await build({
    entrypoints: entryFiles,
    outdir: outDir,
    format: "esm",
    target: "browser",
    minify: true,
    splitting: true,
    naming: "[name].[ext]",
});

// Cleanup temp entries
rmSync(tempEntryDir, { recursive: true, force: true });

if (!result.success) {
    console.error("Build failed:");
    console.error(result.logs);
    process.exit(1);
}

console.log("Svelte libraries bundled successfully!");
